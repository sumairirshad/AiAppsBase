using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class VendorBankAccountsConfiguration : IEntityTypeConfiguration<VendorBankAccounts>
{
    public void Configure(EntityTypeBuilder<VendorBankAccounts> b)
    {
        b.ToTable("VendorBankAccounts");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.VendorId).IsRequired();
        b.Property(x => x.BankName).HasMaxLength(150).IsRequired();
        b.Property(x => x.AccountTitle).HasMaxLength(200).IsRequired();
        b.Property(x => x.AccountNoEncrypted).HasMaxLength(256).IsRequired();
        b.Property(x => x.AccountNoMasked).HasMaxLength(40).IsRequired();
        b.Property(x => x.TitleMatchesLegalName).IsRequired();
        b.Property(x => x.ExceptionApprovedBy);
        b.Property(x => x.IsActive).IsRequired().HasDefaultValueSql("1").ValueGeneratedNever();
        b.HasOne<Vendors>().WithMany().HasForeignKey(x => x.VendorId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Users>().WithMany().HasForeignKey(x => x.ExceptionApprovedBy).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
    }
}
