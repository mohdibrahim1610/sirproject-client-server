using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SIRSearch.Data;
using SIRSearch.Models;
using SIRSearch.Services;

namespace SIRSearch.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ImportController : ControllerBase
    {
        private readonly AppDbContext         _db;
        private readonly PdfExtractorService  _extractor;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly string               _uploadPath;

        public ImportController(
            AppDbContext         db,
            PdfExtractorService  extractor,
            IServiceScopeFactory scopeFactory,
            IConfiguration       config)
        {
            _db           = db;
            _extractor    = extractor;
            _scopeFactory = scopeFactory;
            _uploadPath   = config["UploadPath"]
                            ?? Path.Combine(AppContext.BaseDirectory, "Uploads");
            Directory.CreateDirectory(_uploadPath);
        }

        // ─────────────────────────────────────────
        //  POST /api/import/pdf
        //  Saves file permanently → creates DB job → kicks off background OCR
        //  Returns jobId immediately so frontend can poll
        // ─────────────────────────────────────────
        [HttpPost("pdf")]
        public async Task<IActionResult> ImportPdf(
            IFormFile file,
            [FromQuery] string? district,
            [FromQuery] string? state,
            [FromQuery] int startPage = 2)
        {
            Console.WriteLine($"📥 ImportPdf: file={file?.FileName ?? "NULL"}, size={file?.Length ?? 0}, startPage={startPage}");

            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            if (!file.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
                return BadRequest("Only PDF files are supported.");

            // ── Save to permanent folder (survives server restart) ──
            var safeExt       = Path.GetExtension(file.FileName);
            var savedFileName = $"sir_{Guid.NewGuid():N}{safeExt}";
            var savedPath     = Path.Combine(_uploadPath, savedFileName);

            using (var stream = new FileStream(savedPath, FileMode.Create))
                await file.CopyToAsync(stream);

            var savedSize = new FileInfo(savedPath).Length;
            Console.WriteLine($"✅ Saved: {savedPath} ({savedSize:N0} bytes)");

            if (savedSize == 0)
                return BadRequest("Uploaded file appears empty.");

            // ── Create job row in DB (survives server restart) ──
            var job = new ImportJob
            {
                FileName  = file.FileName,
                FilePath  = savedPath,
                Status    = "pending",
                District  = district  ?? "Hyderabad",
                State     = state     ?? "Telangana",
                StartPage = startPage,
            };
            _db.ImportJobs.Add(job);
            await _db.SaveChangesAsync();

            Console.WriteLine($"📋 Job created: {job.JobId}");

            // ── Fire background OCR task ──
            _ = Task.Run(() => ProcessJobAsync(job.JobId));

            return Accepted(new { jobId = job.JobId, message = "Import queued" });
        }

        // ─────────────────────────────────────────
        //  GET /api/import/job/{jobId}
        //  Frontend polls this every 3 seconds
        // ─────────────────────────────────────────
        [HttpGet("job/{jobId}")]
        public async Task<IActionResult> GetJobStatus(string jobId)
        {
            var job = await _db.ImportJobs.FindAsync(jobId);
            if (job == null) return NotFound(new { error = "Job not found" });

            return Ok(new
            {
                job.JobId,
                job.FileName,
                job.Status,
                job.TotalParsed,
                job.TotalInserted,
                job.TotalSkipped,
                job.Error,
                job.CreatedAt,
                job.CompletedAt,
            });
        }

        // ─────────────────────────────────────────
        //  GET /api/import/jobs  — full import history
        // ─────────────────────────────────────────
        [HttpGet("jobs")]
        public async Task<IActionResult> GetAllJobs()
        {
            var jobs = await _db.ImportJobs
                .OrderByDescending(j => j.CreatedAt)
                .Take(50)
                .Select(j => new
                {
                    j.JobId,
                    j.FileName,
                    j.Status,
                    j.TotalParsed,
                    j.TotalInserted,
                    j.TotalSkipped,
                    j.Error,
                    j.CreatedAt,
                    j.CompletedAt,
                })
                .ToListAsync();

            return Ok(jobs);
        }

        // ─────────────────────────────────────────
        //  POST /api/import/job/{jobId}/retry
        // ─────────────────────────────────────────
        [HttpPost("job/{jobId}/retry")]
        public async Task<IActionResult> RetryJob(string jobId)
        {
            var job = await _db.ImportJobs.FindAsync(jobId);
            if (job == null) return NotFound(new { error = "Job not found" });

            if (job.Status == "running")
                return BadRequest("Job is already running.");

            if (!System.IO.File.Exists(job.FilePath))
                return BadRequest("Original file no longer exists — please re-upload.");

            job.Status        = "pending";
            job.Error         = null;
            job.TotalParsed   = 0;
            job.TotalInserted = 0;
            job.TotalSkipped  = 0;
            job.CompletedAt   = null;
            await _db.SaveChangesAsync();

            _ = Task.Run(() => ProcessJobAsync(job.JobId));

            return Accepted(new { jobId, message = "Job re-queued" });
        }

        // ─────────────────────────────────────────
        //  GET /api/import/stats
        // ─────────────────────────────────────────
        [HttpGet("stats")]
        public async Task<IActionResult> Stats()
        {
            var total   = await _db.Voters.CountAsync();
            var byState = await _db.Voters
                .GroupBy(v => v.State)
                .Select(g => new { state = g.Key, count = g.Count() })
                .ToListAsync();

            return Ok(new { totalVoters = total, byState });
        }

        // ─────────────────────────────────────────
        //  POST /api/import/folder
        // ─────────────────────────────────────────
        [HttpPost("folder")]
        public async Task<IActionResult> ImportFolder(
            [FromQuery] string  folderPath,
            [FromQuery] string? district,
            [FromQuery] string? state)
        {
            if (!Directory.Exists(folderPath))
                return BadRequest($"Folder not found: {folderPath}");

            var pdfFiles = Directory.GetFiles(folderPath, "*.pdf", SearchOption.TopDirectoryOnly);
            if (pdfFiles.Length == 0)
                return BadRequest("No PDF files found in folder.");

            var jobIds = new List<string>();

            foreach (var filePath in pdfFiles.OrderBy(f => f))
            {
                var fileName   = Path.GetFileName(filePath);
                var constMatch = System.Text.RegularExpressions.Regex.Match(
                    fileName, @"S29-(\d+).*ENG-(\d+)");
                string constCode = constMatch.Success ? constMatch.Groups[1].Value : "?";
                string partNo    = constMatch.Success ? constMatch.Groups[2].Value : "?";

                var job = new ImportJob
                {
                    FileName  = fileName,
                    FilePath  = filePath,
                    Status    = "pending",
                    District  = district ?? "Hyderabad",
                    State     = state    ?? "Telangana",
                    StartPage = 2,
                };
                _db.ImportJobs.Add(job);
                await _db.SaveChangesAsync();

                jobIds.Add(job.JobId);
                _ = Task.Run(() => ProcessJobAsync(job.JobId));

                Console.WriteLine($"📋 Queued: {fileName} → job {job.JobId}");
            }

            return Accepted(new
            {
                totalQueued = pdfFiles.Length,
                jobIds,
                message = "All files queued"
            });
        }

        // ─────────────────────────────────────────
        //  BACKGROUND WORKER
        //  Uses its own DB scope — safe for background threads
        // ─────────────────────────────────────────
        private async Task ProcessJobAsync(string jobId)
        {
            using var scope = _scopeFactory.CreateScope();
            var db          = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var job = await db.ImportJobs.FindAsync(jobId);
            if (job == null)
            {
                Console.WriteLine($"⚠️ Job {jobId} not found");
                return;
            }

            job.Status = "running";
            await db.SaveChangesAsync();
            Console.WriteLine($"🔍 Job {jobId} running: {job.FileName}");

            try
            {
                if (!System.IO.File.Exists(job.FilePath))
                    throw new FileNotFoundException($"PDF not found: {job.FilePath}");

                var records = _extractor.ExtractFromScannedPdf(
                    job.FilePath,
                    district:  job.District,
                    state:     job.State,
                    startPage: job.StartPage,
                    maxPages:  999);

                Console.WriteLine($"📊 Job {jobId}: {records.Count} voters extracted");

                // Stamp original filename on every record
                foreach (var r in records)
                    r.SourceFile = job.FileName;

                int inserted = 0;
                foreach (var record in records)
                {
                    bool exists = await db.Voters.AnyAsync(v =>
                        v.NameNormalized == record.NameNormalized &&
                        v.FatherName     == record.FatherName     &&
                        v.SourceFile     == record.SourceFile);

                    if (!exists)
                    {
                        db.Voters.Add(record);
                        inserted++;
                    }
                }

                await db.SaveChangesAsync();

                job.Status        = "done";
                job.TotalParsed   = records.Count;
                job.TotalInserted = inserted;
                job.TotalSkipped  = records.Count - inserted;
                job.CompletedAt   = DateTime.UtcNow;

                Console.WriteLine($"✅ Job {jobId} done: {inserted} inserted, {job.TotalSkipped} skipped");

                // Delete uploaded file only after successful DB write
                if (System.IO.File.Exists(job.FilePath))
                    System.IO.File.Delete(job.FilePath);
            }
            catch (Exception ex)
            {
                job.Status = "error";
                job.Error  = ex.Message;
                Console.WriteLine($"❌ Job {jobId} error: {ex.Message}");
                // File kept on disk intentionally — allows retry
            }

            await db.SaveChangesAsync();
        }
    }
}