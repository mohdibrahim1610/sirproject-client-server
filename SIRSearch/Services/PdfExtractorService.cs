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

            var soundex = input[0].ToString();
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

        private string OcrImage(string imagePath)
        {
            using var engine = new TesseractEngine(_tessDataPath, "eng", EngineMode.Default);
            using var img = Pix.LoadFromFile(imagePath);
            using var page = engine.Process(img);
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

        public List<VoterRecord> ParseSirFormat(string ocrText, string sourceFile,
                                          string district = "", string state = "",
                                          int pageNumber = 0)
        {
            var records = new List<VoterRecord>();
            var lines = ocrText.Split('\n', StringSplitOptions.RemoveEmptyEntries)
                                  .Select(l => l.Trim())
                                  .Where(l => l.Length > 2)
                                  .ToList();
            // ── Extract page-level location header once ──
            var (mandal, postOffice, policeStation,
                 revenueDivision, pinCode, pollingStation, section) = ExtractPageHeader(lines);

            VoterRecord? current = null;

            foreach (var line in lines)
            {
                // Detect serial number line: "211" or "211 DMR2346658"
                var serialMatch = Regex.Match(line, @"^(\d{1,4})\s*(?:[A-Z]{2,4}\d{6,10})?$");
                if (serialMatch.Success && current != null)
                {
                    // Could be serial number — store it
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

                var nameMatch = Regex.Match(line, @"^Name\s*[:\-]\s*(.+)$", RegexOptions.IgnoreCase);
                if (nameMatch.Success
                    && !line.Contains("Father", StringComparison.OrdinalIgnoreCase)
                    && !line.Contains("Husband", StringComparison.OrdinalIgnoreCase)
                    && !line.Contains("House", StringComparison.OrdinalIgnoreCase)
                    && !line.Contains("Reservation", StringComparison.OrdinalIgnoreCase)
                    && !line.Contains("Constituency", StringComparison.OrdinalIgnoreCase))
                {
                    if (current != null) records.Add(current);
                    var name = CleanOcrText(nameMatch.Groups[1].Value);
                    if (string.IsNullOrWhiteSpace(name)) continue;

                    current = new VoterRecord
                    {
                        NameOriginal = name,
                        NameNormalized = NormalizeName(name),
                        PhoneticCode = GetSoundex(name),
                        District = district,
                        State = state,
                        SourceFile = sourceFile,
                        PageNumber = pageNumber,
                        // ── stamp page-level location on every voter ──
                        Mandal = mandal,
                        PostOffice = postOffice,
                        PoliceStation = policeStation,
                        RevenueDivision = revenueDivision,
                        PinCode = pinCode,
                        PollingStation = pollingStation,
                        Section = section,
                    };
                    continue;
                }

                if (current == null) continue;

                var fatherMatch = Regex.Match(line,
                    @"(?:Father|Husband)(?:'?s)?\s*(?:Name)?\s*[:\-]\s*(.+)$",
                    RegexOptions.IgnoreCase);
                if (fatherMatch.Success)
                { current.FatherName = CleanOcrText(fatherMatch.Groups[1].Value); continue; }

                var ageMatch = Regex.Match(line, @"Age\s*[:\+\-]\s*(\d+)", RegexOptions.IgnoreCase);
                if (ageMatch.Success)
                    current.Age = int.TryParse(ageMatch.Groups[1].Value, out int a) ? a : null;

                var genderMatch = Regex.Match(line, @"Gender\s*[:\-]\s*(Male|Female)", RegexOptions.IgnoreCase);
                if (genderMatch.Success) current.Gender = genderMatch.Groups[1].Value;

                var epicMatch = Regex.Match(line, @"\b([A-Z]{2,4}\d{6,10})\b");
                if (epicMatch.Success && string.IsNullOrEmpty(current.BoothNumber))
                    current.BoothNumber = epicMatch.Groups[1].Value;
            }

            if (current != null) records.Add(current);
            return records;
        }
        public List<VoterRecord> ExtractFromScannedPdf(string pdfPath,
                                                 string district = "",
                                                 string state = "",
                                                 int startPage = 0,
                                                 int maxPages = 999)
        {
            var allRecords = new List<VoterRecord>();
            var imagePaths = new List<string>();

            try
            {
                using var lib = DocLib.Instance;
                using var docReader = lib.GetDocReader(pdfPath, new PageDimensions(2480, 3508));
                int totalPages = docReader.GetPageCount();
                int endPage = Math.Min(startPage + maxPages, totalPages);

                Console.WriteLine($"Total pages: {totalPages}, processing pages {startPage + 1} to {endPage}");

                for (int i = startPage; i < endPage; i++)
                {
                    Console.WriteLine($"  Rendering page {i + 1}/{totalPages}...");
                    using var pageReader = docReader.GetPageReader(i);

                    var rawBytes = pageReader.GetImage();
                    int width = pageReader.GetPageWidth();
                    int height = pageReader.GetPageHeight();

                    using var bmp = new Bitmap(width, height,
                        System.Drawing.Imaging.PixelFormat.Format32bppArgb);
                    var bmpData = bmp.LockBits(
                        new Rectangle(0, 0, width, height),
                        System.Drawing.Imaging.ImageLockMode.WriteOnly,
                        System.Drawing.Imaging.PixelFormat.Format32bppArgb);
                    Marshal.Copy(rawBytes, 0, bmpData.Scan0, rawBytes.Length);
                    bmp.UnlockBits(bmpData);

                    var tempPath = Path.Combine(Path.GetTempPath(), $"sir_page_{i}.png");
                    bmp.Save(tempPath, System.Drawing.Imaging.ImageFormat.Png);
                    imagePaths.Add(tempPath);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Render error: {ex.Message}");
            }

            for (int i = 0; i < imagePaths.Count; i++)
            {
                var imgPath = imagePaths[i];
                Console.WriteLine($"  OCR page {i + 1}/{imagePaths.Count}...");
                try
                {
                    var ocrText = OcrImage(imgPath);

                    // Always show sample for first 2 pages we process
                    if (i < 2)
                    {
                        Console.WriteLine($"=== OCR SAMPLE page {startPage + i + 1} ===");
                        Console.WriteLine(ocrText[..Math.Min(1000, ocrText.Length)]);
                        Console.WriteLine("================================");
                    }

                    var pageRecords = ParseSirFormat(ocrText,
                        Path.GetFileName(pdfPath), district, state, pageNumber: startPage + i + 1);
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
        public List<VoterRecord> ExtractFromTextPdf(string filePath)
        {
            var records = new List<VoterRecord>();
            using var pdf = UglyToad.PdfPig.PdfDocument.Open(filePath);
            foreach (var p in pdf.GetPages())
                records.AddRange(ParseSirFormat(p.Text, Path.GetFileName(filePath)));
            return records;
        }
        // Add this method to PdfExtractorService
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

                // "9 - Doodh Bowli" style polling station name
                m = Regex.Match(line, @"^(\d+\s*[-–]\s*[A-Za-z].{3,60})$");
                if (m.Success && !line.Contains("Name") && !line.Contains("Father"))
                { pollingStation = m.Groups[1].Value.Trim(); continue; }

                // Section lines like "1-Pardhi Vada"
                m = Regex.Match(line, @"^(\d+[-–][A-Za-z].{2,40})$");
                if (m.Success) { section = m.Groups[1].Value.Trim(); continue; }
            }

            return (mandal, postOffice, policeStation, revenueDivision, pinCode, pollingStation, section);
        }
    }
}