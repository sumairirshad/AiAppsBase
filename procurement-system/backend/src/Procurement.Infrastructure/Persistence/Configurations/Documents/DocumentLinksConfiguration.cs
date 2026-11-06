using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class DocumentLinksConfiguration : IEntityTypeConfiguration<DocumentLinks>
{
    public void Configure(EntityTypeBuilder<DocumentLinks> b)
    {
        b.ToTable("DocumentLinks");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.DocumentId).IsRequired();
        b.Property(x => x.EntityTypeId).IsRequired();
        b.Property(x => x.EntityId).IsRequired();
        b.HasOne<Documents>().WithMany().HasForeignKey(x => x.DocumentId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<EntityTypes>().WithMany().HasForeignKey(x => x.EntityTypeId).OnDelete(DeleteBehavior.NoAction).IsRequired();
    }
}
