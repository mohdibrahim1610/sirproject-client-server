using FuzzySharp;
using Microsoft.EntityFrameworkCore;
using SIRSearch.Data;
using SIRSearch.Models;

namespace SIRSearch.Services
{
    public class VoterSearchService
    {
        private readonly AppDbContext _db;
        private readonly PdfExtractorService _extractor;

        public VoterSearchService(AppDbContext db, PdfExtractorService extractor)
        {
            _db = db;
            _extractor = extractor;
        }

        public async Task<List<VoterSearchResult>> SearchAsync(string query, string? district = null, int topN = 20)
        {
            if (string.IsNullOrWhiteSpace(query)) return new();

            var normalizedQuery = _extractor.NormalizeName(query);
            var phoneticQuery   = _extractor.GetSoundex(query);

            // Pull candidates: phonetic match OR name starts with first 3 chars
            var prefix = normalizedQuery.Length >= 3 ? normalizedQuery[..3] : normalizedQuery;

            var candidates = await _db.Voters
                .Where(v =>
                    v.PhoneticCode == phoneticQuery ||
                    v.NameNormalized.StartsWith(prefix) ||
                    v.NameNormalized.Contains(normalizedQuery))
                .Where(v => district == null || v.District == district)
                .Take(200) // limit DB load before fuzzy scoring
                .ToListAsync();

            // Score each candidate with FuzzySharp
            var results = candidates
                .Select(v => new VoterSearchResult
                {
                    Voter = v,
                    Score = Fuzz.TokenSortRatio(normalizedQuery, v.NameNormalized)
                })
                .Where(r => r.Score >= 50) // threshold — tune as needed
                .OrderByDescending(r => r.Score)
                .Take(topN)
                .ToList();

            return results;
        }
    }

    public class VoterSearchResult
    {
        public VoterRecord Voter { get; set; } = new();
        public int Score { get; set; }
    }
}