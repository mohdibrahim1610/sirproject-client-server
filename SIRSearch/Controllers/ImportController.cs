using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SIRSearch.Data;
using SIRSearch.Models;
using SIRSearch.Services;

namespace SIRSearch.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ImportController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly PdfExtractorService _extractor;

        public ImportController(AppDbContext db, PdfExtractorService extractor)
        {
            _db = db;
            _extractor = extractor;
        }

        // POST /api/import/pdf
        [HttpPost("pdf")]
        public async Task<IActionResult> ImportPdf(IFormFile file, [FromQuery] string? district, [FromQuery] string? state)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            if (!file.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
                return BadRequest("Only PDF files are supported.");

            // Save uploaded file to temp path
            var tempPath = Path.Combine(Path.GetTempPath(), file.FileName);
            using (var stream = new FileStream(tempPath, FileMode.Create))
                await file.CopyToAsync(stream);

            // Extract voter records
            var records = _extractor.ExtractFromTextPdf(tempPath);

            // Enrich with district/state info
            foreach (var r in records)
            {
                r.District = district ?? "";
                r.State = state ?? "";
            }

            // Save to database (skip duplicates by name+booth)
            int inserted = 0;
            foreach (var record in records)
            {
                bool exists = await _db.Voters.AnyAsync(v =>
                    v.NameNormalized == record.NameNormalized &&
                    v.BoothNumber == record.BoothNumber);

                if (!exists)
                {
                    _db.Voters.Add(record);
                    inserted++;
                }
            }

            await _db.SaveChangesAsync();

            // Cleanup temp file
            System.IO.File.Delete(tempPath);

            return Ok(new
            {
                fileName = file.FileName,
                totalParsed = records.Count,
                inserted,
                skipped = records.Count - inserted
            });
        }

        // GET /api/import/stats
        [HttpGet("stats")]
        public async Task<IActionResult> Stats()
        {
            var total = await _db.Voters.CountAsync();
            var byState = await _db.Voters
                .GroupBy(v => v.State)
                .Select(g => new { state = g.Key, count = g.Count() })
                .ToListAsync();

            return Ok(new { totalVoters = total, byState });
        }



        // POST /api/import/folder
        [HttpPost("folder")]
        public async Task<IActionResult> ImportFolder(
            [FromQuery] string folderPath,
            [FromQuery] string? district,
            [FromQuery] string? state)
        {
            if (!Directory.Exists(folderPath))
                return BadRequest($"Folder not found: {folderPath}");

            var pdfFiles = Directory.GetFiles(folderPath, "*.pdf", SearchOption.TopDirectoryOnly);
            if (pdfFiles.Length == 0)
                return BadRequest("No PDF files found in folder.");

            var summary = new List<object>();
            int totalInserted = 0;

            foreach (var filePath in pdfFiles.OrderBy(f => f))
            {
                Console.WriteLine($"\nProcessing: {Path.GetFileName(filePath)}");

                // Auto-detect constituency from filename
                // e.g. 2025-EROLLGEN-S29-68-FinalRoll-Revision1-ENG-10-WI.pdf
                var fileName = Path.GetFileName(filePath);
                var constMatch = System.Text.RegularExpressions.Regex.Match(
                    fileName, @"S29-(\d+).*ENG-(\d+)");
                string constCode = constMatch.Success ? constMatch.Groups[1].Value : "?";
                string partNo = constMatch.Success ? constMatch.Groups[2].Value : "?";

                try
                {
                    var records = _extractor.ExtractFromScannedPdf(
                        filePath,
                        district: district ?? "Hyderabad",
                        state: state ?? "Telangana",
                        startPage: 2,
                        maxPages: 999
                    );

                    // Tag each record with constituency + part info
                    // Tag each record with constituency + part info
                    foreach (var r in records)
                    {
                        r.SourceFile = fileName;
                        r.ConstituencyCode = constCode;
                        r.PartNumber = partNo;
                    }

                    // Insert only new records (avoid duplicates across files)
                    int inserted = 0;
                    foreach (var record in records)
                    {
                        bool exists = await _db.Voters.AnyAsync(v =>
                            v.NameNormalized == record.NameNormalized &&
                            v.FatherName == record.FatherName &&
                            v.SourceFile == record.SourceFile);

                        if (!exists)
                        {
                            _db.Voters.Add(record);
                            inserted++;
                        }
                    }

                    await _db.SaveChangesAsync();
                    totalInserted += inserted;

                    summary.Add(new
                    {
                        file = fileName,
                        constituency = $"C{constCode}",
                        part = partNo,
                        extracted = records.Count,
                        inserted,
                        skipped = records.Count - inserted
                    });

                    Console.WriteLine($"  Done: {inserted} inserted from {fileName}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"  ERROR on {fileName}: {ex.Message}");
                    summary.Add(new { file = fileName, error = ex.Message });
                }
            }

            return Ok(new
            {
                totalFiles = pdfFiles.Length,
                totalInserted,
                files = summary
            });
        }
    }
}