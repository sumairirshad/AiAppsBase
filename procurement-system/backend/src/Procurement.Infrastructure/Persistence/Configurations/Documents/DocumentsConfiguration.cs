using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class DocumentsConfiguration : IEntityTypeConfiguration<Documents>
{
    public void Configure(EntityTypeBuilder<Documents> b)
    {
        b.ToTable("Documents");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.StorageKey).HasMaxLength(300).IsRequired();
        b.Property(x => x.FileName).HasMaxLength(260).IsRequired();
        b.Property(x => x.ContentType).HasMaxLength(100).IsRequired();
        b.Property(x => x.SizeBytes).IsRequired();
        b.Property(x => x.Sha256).HasMaxLength(64).IsFixedLength().IsRequired();
        b.Property(x => x.DocumentTypeId).IsRequired();
        b.Property(x => x.Classification).HasMaxLength(20).IsRequired().HasDefaultValueSql("'Internal'").ValueGeneratedNever();
        b.Property(x => x.VersionNo).IsRequired().HasDefaultValueSql("1").ValueGeneratedNever();
        b.Property(x => x.ReplacesDocumentId);
        b.HasIndex(x => x.StorageKey).IsUnique();
        b.HasOne<DocumentTypes>().WithMany().HasForeignKey(x => x.DocumentTypeId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Documents>().WithMany().HasForeignKey(x => x.ReplacesDocumentId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
    }
}
