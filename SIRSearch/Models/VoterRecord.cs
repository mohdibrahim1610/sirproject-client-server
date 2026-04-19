namespace SIRSearch.Models
{
    public class VoterRecord
    {
        public int Id { get; set; }
        public string NameOriginal { get; set; } = "";
        public string NameNormalized { get; set; } = "";
        public string FatherName { get; set; } = "";
        public string PhoneticCode { get; set; } = "";
        public int? Age { get; set; }
        public string Gender { get; set; } = "";
        public string BoothNumber { get; set; } = "";
        public string District { get; set; } = "";
        public string State { get; set; } = "";
        public string SourceFile { get; set; } = "";
        public int? SerialNumber { get; set; }
        public int? PageNumber { get; set; }
        public string ConstituencyCode { get; set; } = "";
        public string PartNumber { get; set; } = "";

        // ── NEW FIELDS ──
        public string Mandal { get; set; } = "";
        public string PostOffice { get; set; } = "";
        public string PollingStation { get; set; } = "";   // e.g. "9 - Doodh Bowli"
        public string PoliceStation { get; set; } = "";
        public string RevenueDivision { get; set; } = "";
        public string PinCode { get; set; } = "";
        public string Section { get; set; } = "";
    }
}