using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class ContractTemplatesConfiguration : IEntityTypeConfiguration<ContractTemplates>
{
    public void Configure(EntityTypeBuilder<ContractTemplates> b)
    {
        b.ToTable("ContractTemplates");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.Code).HasMaxLength(30).IsRequired();
        b.Property(x => x.Name).HasMaxLength(150).IsRequired();
        b.Property(x => x.ContractTypeId).IsRequired();
        b.Property(x => x.Version).IsRequired();
        b.Property(x => x.IsActive).IsRequired().HasDefaultValueSql("1").ValueGeneratedNever();
        b.HasIndex(x => x.Code).IsUnique();
        b.HasOne<ContractTypes>().WithMany().HasForeignKey(x => x.ContractTypeId).OnDelete(DeleteBehavior.NoAction).IsRequired();
    }
}
