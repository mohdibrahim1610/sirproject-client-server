using Microsoft.EntityFrameworkCore;
using SIRSearch.Models;

namespace SIRSearch.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<VoterRecord> Voters { get; set; }
        public DbSet<ImportJob> ImportJobs { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<VoterRecord>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.NameOriginal).HasMaxLength(200);
                entity.Property(e => e.NameNormalized).HasMaxLength(200);
                entity.Property(e => e.PhoneticCode).HasMaxLength(10);
                entity.Property(e => e.FatherName).HasMaxLength(200);
                entity.Property(e => e.Gender).HasMaxLength(10);
                entity.Property(e => e.BoothNumber).HasMaxLength(50);
                entity.Property(e => e.District).HasMaxLength(100);
                entity.Property(e => e.State).HasMaxLength(100);
                entity.Property(e => e.SourceFile).HasMaxLength(300);

                // Index for fast search
                entity.HasIndex(e => e.NameNormalized);
                entity.HasIndex(e => e.PhoneticCode);
            });
        }
    }
}