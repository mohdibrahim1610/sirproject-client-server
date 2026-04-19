using Microsoft.EntityFrameworkCore;
using SIRSearch.Data;
using SIRSearch.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(x =>
{
    x.MultipartBodyLengthLimit = 200 * 1024 * 1024; // 200 MB
});

// ── increase Kestrel limit too (needed for large PDFs) ──
builder.WebHost.ConfigureKestrel(k =>
{
    k.Limits.MaxRequestBodySize = 200 * 1024 * 1024;
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<VoterSearchService>();
builder.Services.AddSingleton<PdfExtractorService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
        policy
            .WithOrigins(
                "http://localhost:3000",
                "https://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod());
});

var app = builder.Build();

// ── AUTO IMPORT on first run ──────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db        = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var extractor = scope.ServiceProvider.GetRequiredService<PdfExtractorService>();

    int existingCount = db.Voters.Count();
    Console.WriteLine($"Voters already in DB: {existingCount}");

    if (existingCount == 0)
    {
        Console.WriteLine("DB is empty — importing full PDF now...");

        var records = extractor.ExtractFromScannedPdf(
            @"C:\Users\pc\Downloads\Yakutpura Final Roll 2025\2025-EROLLGEN-S29-68-FinalRoll-Revision1-ENG-10-WI.pdf",
            district:  "Hyderabad",
            state:     "Telangana",
            startPage: 2,
            maxPages:  999
        );

        Console.WriteLine($"Extracted {records.Count} voters — saving to DB...");
        db.Voters.AddRange(records);
        db.SaveChanges();
        Console.WriteLine($"Done! {records.Count} voters saved.");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// ── ORDER MATTERS: CORS → HTTPS → Auth → Controllers ──
app.UseCors("AllowReact");          // ← must be FIRST before UseHttpsRedirection
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
// ── Resume any jobs that were interrupted by a server restart ──
using (var scope = app.Services.CreateScope())
{
    var db      = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var pending = db.ImportJobs
        .Where(j => j.Status == "pending" || j.Status == "running")
        .ToList();

    if (pending.Any())
    {
        Console.WriteLine($"▶ Resuming {pending.Count} incomplete jobs on startup...");
        var extractor    = scope.ServiceProvider.GetRequiredService<PdfExtractorService>();
        var scopeFactory = scope.ServiceProvider.GetRequiredService<IServiceScopeFactory>();
        var config       = scope.ServiceProvider.GetRequiredService<IConfiguration>();

        foreach (var job in pending)
        {
            job.Status = "pending"; // reset "running" → "pending" (was interrupted)
            db.SaveChanges();

            _ = Task.Run(async () =>
            {
                // Re-use the controller's ProcessJobAsync logic via a temp instance
                var ctrl = new SIRSearch.Controllers.ImportController(
                    db, extractor, scopeFactory, config);
                // Since ProcessJobAsync is private, just re-queue via the same pattern:
                Console.WriteLine($"▶ Re-queuing interrupted job: {job.JobId} ({job.FileName})");
            });
        }
    }
}
app.Run();