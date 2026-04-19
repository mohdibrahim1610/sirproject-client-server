using Microsoft.EntityFrameworkCore;
using SIRSearch.Data;
using SIRSearch.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(x =>
{
    x.MultipartBodyLengthLimit = 100 * 1024 * 1024;
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<VoterSearchService>();
builder.Services.AddSingleton<PdfExtractorService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

// ── AUTO IMPORT on first run ───────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db        = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var extractor = scope.ServiceProvider.GetRequiredService<PdfExtractorService>();

    int existingCount = db.Voters.Count();
    Console.WriteLine($"Voters already in DB: {existingCount}");

    if (existingCount == 0)
    {
        Console.WriteLine("DB is empty — importing full PDF now (this takes 5-10 mins)...");

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
        Console.WriteLine($"Done! {records.Count} voters saved to database.");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowReact");
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();