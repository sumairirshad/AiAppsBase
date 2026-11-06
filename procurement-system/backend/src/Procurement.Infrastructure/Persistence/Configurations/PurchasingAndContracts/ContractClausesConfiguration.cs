using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class ContractClausesConfiguration : IEntityTypeConfiguration<ContractClauses>
{
    public void Configure(EntityTypeBuilder<ContractClauses> b)
    {
        b.ToTable("ContractClauses");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.TemplateId).IsRequired();
        b.Property(x => x.ClauseCategoryId).IsRequired();
        b.Property(x => x.Sequence).IsRequired();
        b.Property(x => x.Title).HasMaxLength(150).IsRequired();
        b.Property(x => x.Body).IsRequired();
        b.Property(x => x.IsMandatory).IsRequired().HasDefaultValueSql("1").ValueGeneratedNever();
        b.HasOne<ContractTemplates>().WithMany().HasForeignKey(x => x.TemplateId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<ClauseCategories>().WithMany().HasForeignKey(x => x.ClauseCategoryId).OnDelete(DeleteBehavior.NoAction).IsRequired();
    }
}
