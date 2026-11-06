using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class ContractsConfiguration : IEntityTypeConfiguration<Contracts>
{
    public void Configure(EntityTypeBuilder<Contracts> b)
    {
        b.ToTable("Contracts");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.PoId).IsRequired();
        b.Property(x => x.ContractTypeId).IsRequired();
        b.Property(x => x.Terms).IsRequired();
        b.Property(x => x.StartDate);
        b.Property(x => x.EndDate);
        b.Property(x => x.GeneratedDocumentId);
        b.Property(x => x.SignedDocumentId);
        b.Property(x => x.TemplateId);
        b.Property(x => x.GoverningLaw).HasMaxLength(100).IsRequired().HasDefaultValueSql("'Laws of Pakistan'").ValueGeneratedNever();
        b.Property(x => x.CountryOfOrigin).HasMaxLength(60);
        b.Property(x => x.Incoterms).HasMaxLength(10);
        b.Property(x => x.ChequeNo).HasMaxLength(40);
        b.Property(x => x.ChequeBank).HasMaxLength(150);
        b.Property(x => x.ChequeAmount).HasColumnType("decimal(18,2)");
        b.Property(x => x.ChequeDocumentId);
        b.Property(x => x.ChequeStatusId);
        b.HasIndex(x => x.PoId).IsUnique();
        b.HasOne<PurchaseOrders>().WithMany().HasForeignKey(x => x.PoId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<ContractTypes>().WithMany().HasForeignKey(x => x.ContractTypeId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Documents>().WithMany().HasForeignKey(x => x.GeneratedDocumentId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
        b.HasOne<Documents>().WithMany().HasForeignKey(x => x.SignedDocumentId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
        b.HasOne<ContractTemplates>().WithMany().HasForeignKey(x => x.TemplateId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
        b.HasOne<Documents>().WithMany().HasForeignKey(x => x.ChequeDocumentId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
        b.HasOne<SecurityDepositStatuses>().WithMany().HasForeignKey(x => x.ChequeStatusId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
    }
}
