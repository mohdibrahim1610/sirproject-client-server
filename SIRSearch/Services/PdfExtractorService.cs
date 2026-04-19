using Docnet.Core;
using Docnet.Core.Models;
using Tesseract;
using SIRSearch.Models;
using System.Text.RegularExpressions;
using System.Drawing;
using System.Runtime.InteropServices;

namespace SIRSearch.Services
{
    public class PdfExtractorService
    {
        private readonly string _tessDataPath;

        public PdfExtractorService()
        {
            _tessDataPath = Path.Combine(AppContext.BaseDirectory, "tessdata");
            if (!Directory.Exists(_tessDataPath))
                Directory.CreateDirectory(_tessDataPath);
        }

        // ─────────────────────────────────────────
        //  NAME HELPERS
        // ─────────────────────────────────────────

        public string NormalizeName(string name)
        {
            if (string.IsNullOrWhiteSpace(name)) return "";
            name = name.ToLower().Trim();
            name = Regex.Replace(name, @"[^a-z0-9\s]", "");
            name = Regex.Replace(name, @"\s+", " ");
            return name.Trim();
        }

        private string NormalizeNameVariants(string name)
        {
            var variants = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                {"mohd","mohammed"},{"md","mohammed"},{"mohammad","mohammed"},
                {"muhammed","mohammed"},{"kumaar","kumar"},{"raam","ram"},
                {"sures","suresh"},{"venkat","venkata"},{"laxmi","lakshmi"},
            };
            var words = name.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            for (int i = 0; i < words.Length; i++)
                if (variants.ContainsKey(words[i])) words[i] = variants[words[i]];
            return string.Join(" ", words);
        }

        public string GetSoundex(string input)
        {
            if (string.IsNullOrWhiteSpace(input)) return "";
            input = NormalizeName(input);
            input = NormalizeNameVariants(input);
            input = input.ToUpper();
            if (input.Length == 0) return "";

            var codes = new Dictionary<char, char>
            {
                {'B','2'},{'F','2'},{'P','2'},{'V','2'},
                {'C','3'},{'G','3'},{'J','3'},{'K','3'},{'Q','3'},{'S','3'},{'X','3'},{'Z','3'},
                {'D','4'},{'T','4'},{'L','5'},{'M','6'},{'N','6'},{'R','7'}
            };

            var soundex  = input[0].ToString();
            char prevCode = codes.ContainsKey(input[0]) ? codes[input[0]] : '0';

            foreach (char c in input.Skip(1))
            {
                if (c == 'H' || c == 'W') continue;
                if (codes.ContainsKey(c))
                {
                    char code = codes[c];
                    if (code != prevCode) { soundex += code; if (soundex.Length == 4) break; }
                    prevCode = code;
                }
                else prevCode = '0';
            }
            return soundex.PadRight(4, '0');
        }

        // ─────────────────────────────────────────
        //  OCR
        // ─────────────────────────────────────────

        private string OcrImage(string imagePath)
        {
            using var engine = new TesseractEngine(_tessDataPath, "eng", EngineMode.Default);
            using var img    = Pix.LoadFromFile(imagePath);
            using var page   = engine.Process(img);
            return page.GetText();
        }

        private string CleanOcrText(string text)
        {
            text = text.Trim();
            text = Regex.Replace(text, @"\s*(Photo|Available|House|Age).*$", "",
                                  RegexOptions.IgnoreCase);
            text = text.Replace("|", "I");
            return text.Trim();
        }

        // ─────────────────────────────────────────
        //  HEADER EXTRACTOR
        // ─────────────────────────────────────────

        private (string mandal, string postOffice, string policeStation,
                 string revenueDivision, string pinCode, string pollingStation,
                 string section) ExtractPageHeader(List<string> lines)
        {
            string mandal = "", postOffice = "", policeStation = "",
                   revenueDivision = "", pinCode = "", pollingStation = "", section = "";

            foreach (var line in lines)
            {
                var m = Regex.Match(line, @"Mandal\s*[:\-]\s*(.+)", RegexOptions.IgnoreCase);
                if (m.Success) { mandal = m.Groups[1].Value.Trim(); continue; }

                m = Regex.Match(line, @"Post\s*Office\s*[:\-]\s*(.+)", RegexOptions.IgnoreCase);
                if (m.Success) { postOffice = m.Groups[1].Value.Trim(); continue; }

                m = Regex.Match(line, @"Police\s*Station\s*[:\-]\s*(.+)", RegexOptions.IgnoreCase);
                if (m.Success) { policeStation = m.Groups[1].Value.Trim(); continue; }

                m = Regex.Match(line, @"Revenue\s*Division\s*[:\-]\s*(.+)", RegexOptions.IgnoreCase);
                if (m.Success) { revenueDivision = m.Groups[1].Value.Trim(); continue; }

                m = Regex.Match(line, @"Pin\s*[Cc]ode\s*[:\-]\s*(\d{6})", RegexOptions.IgnoreCase);
                if (m.Success) { pinCode = m.Groups[1].Value.Trim(); continue; }

                // "9 - Doodh Bowli" style polling station
                m = Regex.Match(line, @"^(\d+\s*[-–]\s*[A-Za-z].{3,60})$");
                if (m.Success && !line.Contains("Name") && !line.Contains("Father"))
                { pollingStation = m.Groups[1].Value.Trim(); continue; }

                // Section lines like "1-Pardhi Vada"
                m = Regex.Match(line, @"^(\d+[-–][A-Za-z].{2,40})$");
                if (m.Success) { section = m.Groups[1].Value.Trim(); continue; }
            }

            return (mandal, postOffice, policeStation, revenueDivision, pinCode, pollingStation, section);
        }

        // ─────────────────────────────────────────
        //  PARSER
        // ─────────────────────────────────────────

        public List<VoterRecord> ParseSirFormat(
            string ocrText,
            string sourceFile,
            string district        = "",
            string state           = "",
            int    pageNumber      = 0,
            string mandal          = "",
            string postOffice      = "",
            string policeStation   = "",
            string revenueDivision = "",
            string pinCode         = "",
            string pollingStation  = "",
            string section         = "")
        {
            var records = new List<VoterRecord>();
            var lines   = ocrText.Split('\n', StringSplitOptions.RemoveEmptyEntries)
                                  .Select(l => l.Trim())
                                  .Where(l => l.Length > 2)
                                  .ToList();

            VoterRecord? current = null;

            foreach (var line in lines)
            {
                // Serial number line: "211" or "211 DMR2346658"
                var serialMatch = Regex.Match(line, @"^(\d{1,4})\s*(?:[A-Z]{2,4}\d{6,10})?$");
                if (serialMatch.Success && current != null)
                {
                    if (int.TryParse(serialMatch.Groups[1].Value, out int sn) && sn > 0 && sn < 5000)
                        current.SerialNumber = sn;
                    continue;
                }

                // EPIC on same line as serial: "211  DMR2346658"
                var serialEpicMatch = Regex.Match(line, @"^(\d{1,4})\s+([A-Z]{2,4}\d{6,10})$");
                if (serialEpicMatch.Success)
                {
                    if (current != null && int.TryParse(serialEpicMatch.Groups[1].Value, out int sn2))
                        current.SerialNumber = sn2;
                    continue;
                }

                // Name line
                var nameMatch = Regex.Match(line, @"^Name\s*[:\-]\s*(.+)$", RegexOptions.IgnoreCase);
                if (nameMatch.Success
                    && !line.Contains("Father",       StringComparison.OrdinalIgnoreCase)
                    && !line.Contains("Husband",      StringComparison.OrdinalIgnoreCase)
                    && !line.Contains("House",        StringComparison.OrdinalIgnoreCase)
                    && !line.Contains("Reservation",  StringComparison.OrdinalIgnoreCase)
                    && !line.Contains("Constituency", StringComparison.OrdinalIgnoreCase))
                {
                    if (current != null) records.Add(current);
                    var name = CleanOcrText(nameMatch.Groups[1].Value);
                    if (string.IsNullOrWhiteSpace(name)) continue;

                    current = new VoterRecord
                    {
                        NameOriginal    = name,
                        NameNormalized  = NormalizeName(name),
                        PhoneticCode    = GetSoundex(name),
                        District        = district,
                        State           = state,
                        SourceFile      = sourceFile,
                        PageNumber      = pageNumber,
                        Mandal          = mandal,
                        PostOffice      = postOffice,
                        PoliceStation   = policeStation,
                        RevenueDivision = revenueDivision,
                        PinCode         = pinCode,
                        PollingStation  = pollingStation,
                        Section         = section,
                    };
                    continue;
                }

                if (current == null) continue;

                // Father / Husband
                var fatherMatch = Regex.Match(line,
                    @"(?:Father|Husband)(?:'?s)?\s*(?:Name)?\s*[:\-]\s*(.+)$",
                    RegexOptions.IgnoreCase);
                if (fatherMatch.Success)
                { current.FatherName = CleanOcrText(fatherMatch.Groups[1].Value); continue; }

                // Age
                var ageMatch = Regex.Match(line, @"Age\s*[:\+\-]\s*(\d+)", RegexOptions.IgnoreCase);
                if (ageMatch.Success)
                    current.Age = int.TryParse(ageMatch.Groups[1].Value, out int a) ? a : null;

                // Gender
                var genderMatch = Regex.Match(line, @"Gender\s*[:\-]\s*(Male|Female)", RegexOptions.IgnoreCase);
                if (genderMatch.Success) current.Gender = genderMatch.Groups[1].Value;

                // EPIC number
                var epicMatch = Regex.Match(line, @"\b([A-Z]{2,4}\d{6,10})\b");
                if (epicMatch.Success && string.IsNullOrEmpty(current.BoothNumber))
                    current.BoothNumber = epicMatch.Groups[1].Value;
            }

            if (current != null) records.Add(current);
            return records;
        }

        // ─────────────────────────────────────────
        //  RENDER HELPER  (opens its own DocLib)
        // ─────────────────────────────────────────

        private string RenderPageToTemp(string pdfPath, int pageIndex)
        {
            using var lib        = DocLib.Instance;
            using var docReader  = lib.GetDocReader(pdfPath, new PageDimensions(2480, 3508));
            using var pageReader = docReader.GetPageReader(pageIndex);

            var rawBytes = pageReader.GetImage();
            int width    = pageReader.GetPageWidth();
            int height   = pageReader.GetPageHeight();

            using var bmp = new Bitmap(width, height,
                System.Drawing.Imaging.PixelFormat.Format32bppArgb);
            var bmpData = bmp.LockBits(
                new Rectangle(0, 0, width, height),
                System.Drawing.Imaging.ImageLockMode.WriteOnly,
                System.Drawing.Imaging.PixelFormat.Format32bppArgb);
            Marshal.Copy(rawBytes, 0, bmpData.Scan0, rawBytes.Length);
            bmp.UnlockBits(bmpData);

            var tempPath = Path.Combine(Path.GetTempPath(),
                $"sir_page_{pageIndex}_{Guid.NewGuid():N}.png");
            bmp.Save(tempPath, System.Drawing.Imaging.ImageFormat.Png);
            return tempPath;
        }

        // ─────────────────────────────────────────
        //  SCANNED PDF  (OCR path)
        // ─────────────────────────────────────────

        public List<VoterRecord> ExtractFromScannedPdf(string pdfPath,
                                                       string district  = "",
                                                       string state     = "",
                                                       int    startPage = 0,
                                                       int    maxPages  = 999)
        {
            var allRecords = new List<VoterRecord>();
            var imagePaths = new List<string>();

            // ── Step 1: get total page count, then render ──
            int totalPages;
            using (var lib = DocLib.Instance)
            using (var docReader = lib.GetDocReader(pdfPath, new PageDimensions(2480, 3508)))
                totalPages = docReader.GetPageCount();

            int headerScanPages = Math.Min(3, startPage);   // pages before voter content
            int endPage         = Math.Min(startPage + maxPages, totalPages);

            Console.WriteLine($"Total pages: {totalPages}, header pages: 0-{headerScanPages - 1}, voter pages: {startPage}-{endPage - 1}");

            // Render header pages (0 … startPage-1, max 3)
            for (int i = 0; i < headerScanPages; i++)
                imagePaths.Add(RenderPageToTemp(pdfPath, i));

            // Render voter pages
            for (int i = startPage; i < endPage; i++)
                imagePaths.Add(RenderPageToTemp(pdfPath, i));

            // ── Step 2: OCR header pages for location info ──
            string mandal = "", postOffice = "", policeStation = "",
                   revenueDivision = "", pinCode = "", pollingStation = "", section = "";

            for (int i = 0; i < headerScanPages; i++)
            {
                if (!File.Exists(imagePaths[i])) continue;
                try
                {
                    var ocrText = OcrImage(imagePaths[i]);
                    var lines   = ocrText.Split('\n', StringSplitOptions.RemoveEmptyEntries)
                                         .Select(l => l.Trim()).Where(l => l.Length > 2).ToList();
                    var h = ExtractPageHeader(lines);

                    if (string.IsNullOrEmpty(mandal)         && !string.IsNullOrEmpty(h.mandal))         mandal         = h.mandal;
                    if (string.IsNullOrEmpty(postOffice)      && !string.IsNullOrEmpty(h.postOffice))      postOffice      = h.postOffice;
                    if (string.IsNullOrEmpty(policeStation)   && !string.IsNullOrEmpty(h.policeStation))   policeStation   = h.policeStation;
                    if (string.IsNullOrEmpty(revenueDivision) && !string.IsNullOrEmpty(h.revenueDivision)) revenueDivision = h.revenueDivision;
                    if (string.IsNullOrEmpty(pinCode)         && !string.IsNullOrEmpty(h.pinCode))         pinCode         = h.pinCode;
                    if (string.IsNullOrEmpty(pollingStation)  && !string.IsNullOrEmpty(h.pollingStation))  pollingStation  = h.pollingStation;
                    if (string.IsNullOrEmpty(section)         && !string.IsNullOrEmpty(h.section))         section         = h.section;
                }
                finally
                {
                    if (File.Exists(imagePaths[i])) File.Delete(imagePaths[i]);
                }
            }

            Console.WriteLine($"  📍 Header → Mandal:{mandal} | PO:{postOffice} | Booth:{pollingStation} | PIN:{pinCode}");

            // ── Step 3: OCR voter pages ──
            var voterImages = imagePaths.Skip(headerScanPages).ToList();
            for (int i = 0; i < voterImages.Count; i++)
            {
                var imgPath = voterImages[i];
                Console.WriteLine($"  OCR page {i + 1}/{voterImages.Count}...");
                try
                {
                    var ocrText    = OcrImage(imgPath);

                    if (i < 2)
                    {
                        Console.WriteLine($"=== OCR SAMPLE page {startPage + i + 1} ===");
                        Console.WriteLine(ocrText[..Math.Min(800, ocrText.Length)]);
                        Console.WriteLine("================================");
                    }

                    var pageRecords = ParseSirFormat(ocrText,
                        Path.GetFileName(pdfPath),
                        district, state,
                        pageNumber:      startPage + i + 1,
                        mandal:          mandal,
                        postOffice:      postOffice,
                        policeStation:   policeStation,
                        revenueDivision: revenueDivision,
                        pinCode:         pinCode,
                        pollingStation:  pollingStation,
                        section:         section);

                    Console.WriteLine($"    → {pageRecords.Count} voters on page {startPage + i + 1}");
                    allRecords.AddRange(pageRecords);
                }
                finally
                {
                    if (File.Exists(imgPath)) File.Delete(imgPath);
                }
            }

            Console.WriteLine($"\nTOTAL voters extracted: {allRecords.Count}");
            return allRecords;
        }

        // ─────────────────────────────────────────
        //  TEXT PDF  (PdfPig path — UI single upload)
        // ─────────────────────────────────────────

        public List<VoterRecord> ExtractFromTextPdf(string filePath)
        {
            string headerText = "";

            using var pdf  = UglyToad.PdfPig.PdfDocument.Open(filePath);
            int total      = pdf.NumberOfPages;

            // First 3 pages → header
            for (int i = 1; i <= Math.Min(3, total); i++)
                headerText += pdf.GetPage(i).Text + "\n";

            var headerLines = headerText
                .Split('\n', StringSplitOptions.RemoveEmptyEntries)
                .Select(l => l.Trim()).Where(l => l.Length > 2).ToList();

            var h = ExtractPageHeader(headerLines);
            Console.WriteLine($"  📍 Text PDF Header → Mandal:{h.mandal} | Booth:{h.pollingStation}");

            var records = new List<VoterRecord>();

            // Voter pages: skip first 3 cover/header pages
            for (int i = 4; i <= total; i++)
            {
                var pageText = pdf.GetPage(i).Text;
                records.AddRange(ParseSirFormat(pageText,
                    Path.GetFileName(filePath),
                    pageNumber:      i,
                    mandal:          h.mandal,
                    postOffice:      h.postOffice,
                    policeStation:   h.policeStation,
                    revenueDivision: h.revenueDivision,
                    pinCode:         h.pinCode,
                    pollingStation:  h.pollingStation,
                    section:         h.section));
            }

            return records;
        }
    }
}