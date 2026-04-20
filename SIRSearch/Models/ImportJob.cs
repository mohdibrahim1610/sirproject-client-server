using System.ComponentModel.DataAnnotations;

namespace SIRSearch.Models
{
    public class ImportJob
    {
        [Key]
        public string JobId { get; set; } = Guid.NewGuid().ToString("N");
        public string FileName { get; set; } = "";
        public string FilePath { get; set; } = "";
        public string Status { get; set; } = "pending";
        public string District { get; set; } = "";
        public string State { get; set; } = "";
        public int StartPage { get; set; } = 2;
        public int TotalParsed { get; set; }
        public int TotalInserted { get; set; }
        public int TotalSkipped { get; set; }
        public string? Error { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; }
        // ← ADD THESE TWO
        public int PagesProcessed { get; set; }
        public int TotalPages { get; set; }
    }
}