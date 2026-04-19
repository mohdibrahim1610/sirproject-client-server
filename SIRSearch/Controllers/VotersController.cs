using Microsoft.AspNetCore.Mvc;
using SIRSearch.Services;

namespace SIRSearch.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VotersController : ControllerBase
    {
        private readonly VoterSearchService _search;

        public VotersController(VoterSearchService search)
        {
            _search = search;
        }

        // GET /api/voters/search?name=ibrahim&district=Hyderabad
        [HttpGet("search")]
        public async Task<IActionResult> Search(
            [FromQuery] string name,
            [FromQuery] string? district = null)
        {
            if (string.IsNullOrWhiteSpace(name))
                return BadRequest("Name is required.");

            var results = await _search.SearchAsync(name, district);

            return Ok(new
            {
                query = name,
                totalFound = results.Count,
                results = results.Select(r => new
                {
                    r.Score,
                    r.Voter.NameOriginal,
                    r.Voter.FatherName,
                    r.Voter.Age,
                    r.Voter.Gender,
                    r.Voter.BoothNumber,
                    r.Voter.District,
                    r.Voter.State,
                    r.Voter.SerialNumber,
                    r.Voter.PageNumber,

                    // ── new fields ──
                    r.Voter.Mandal,
                    r.Voter.PostOffice,
                    r.Voter.PoliceStation,
                    r.Voter.RevenueDivision,
                    r.Voter.PinCode,
                    r.Voter.PollingStation,
                    r.Voter.Section,
                })
            });
        }
    }
}