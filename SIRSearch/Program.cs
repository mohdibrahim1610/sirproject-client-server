using Microsoft.EntityFrameworkCore;
using SIRSearch.Data;
using SIRSearch.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(x =>
{
    x.MultipartBodyLengthLimit = 200 * 1024 * 1024;
});

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
            .WithOrigins("http://localhost:3000", "https://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod());
});

var app = builder.Build();

// ═══════════════════════════════════════════════════════
//  ALL STARTUP TASKS — single scope block so db stays in scope
// ═══════════════════════════════════════════════════════
using (var scope = app.Services.CreateScope())
{
    var db        = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var extractor = scope.ServiceProvider.GetRequiredService<PdfExtractorService>();

    // ── 1. Auto-import on first run ──────────────────────────────────────
    int existingCount = db.Voters.Count();
    Console.WriteLine($"Voters already in DB: {existingCount}");

    if (existingCount == 0)
    {
        var autoPath = @"C:\Users\pc\Downloads\Yakutpura Final Roll 2025\2025-EROLLGEN-S29-68-FinalRoll-Revision1-ENG-10-WI.pdf";
        if (File.Exists(autoPath))
        {
            Console.WriteLine("DB is empty — importing full PDF now...");
            var records = extractor.ExtractFromScannedPdf(
                autoPath, district: "Hyderabad", state: "Telangana", startPage: 2, maxPages: 999);
            Console.WriteLine($"Extracted {records.Count} voters — saving...");
            db.Voters.AddRange(records);
            db.SaveChanges();
            Console.WriteLine($"Done! {records.Count} voters saved.");
        }
        else
        {
            Console.WriteLine("DB is empty but auto-import PDF not found — skipping.");
        }
    }

    // ── 2. Clean up completed jobs older than 7 days ─────────────────────
    var cutoff  = DateTime.UtcNow.AddDays(-7);
    var oldJobs = db.ImportJobs
        .Where(j => j.Status == "done" && j.CreatedAt < cutoff)
        .ToList();
    if (oldJobs.Any())
    {
        db.ImportJobs.RemoveRange(oldJobs);
        db.SaveChanges();
        Console.WriteLine($"🧹 Cleaned up {oldJobs.Count} old import jobs");
    }

    // ── 3. Mark interrupted jobs so user can retry ───────────────────────
    var interrupted = db.ImportJobs
        .Where(j => j.Status == "running" || j.Status == "pending")
        .ToList();
    if (interrupted.Any())
    {
        Console.WriteLine($"⚠️ Found {interrupted.Count} interrupted job(s) from previous run");
        foreach (var j in interrupted)
        {
            j.Status = "error";
            j.Error  = File.Exists(j.FilePath)
                ? "Server restarted during processing — click Retry to re-run"
                : "Server restarted and upload file was lost — please re-upload";
            Console.WriteLine($"  → {j.FileName}: {j.Error}");
        }
        db.SaveChanges();
    }
}

// ═══════════════════════════════════════════════════════
//  MIDDLEWARE PIPELINE
// ═══════════════════════════════════════════════════════
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowReact");
// app.UseHttpsRedirection(); // disabled for local dev
app.UseAuthorization();
app.MapControllers();

app.Run();