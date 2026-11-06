using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class VendorRegistrationRequestsConfiguration : IEntityTypeConfiguration<VendorRegistrationRequests>
{
    public void Configure(EntityTypeBuilder<VendorRegistrationRequests> b)
    {
        b.ToTable("VendorRegistrationRequests");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.RequestNo).HasMaxLength(20).IsRequired();
        b.Property(x => x.ProposedData).IsRequired();
        b.Property(x => x.ProposedByUserId).IsRequired();
        b.Property(x => x.SourceRoleId).IsRequired();
        b.Property(x => x.StatusId).IsRequired();
        b.Property(x => x.ProcurementDecisionBy);
        b.Property(x => x.ProcurementReason).HasMaxLength(500);
        b.Property(x => x.CreatedVendorId);
        b.Property(x => x.ProcurementHodDecisionBy);
        b.Property(x => x.ProcurementHodReason).HasMaxLength(500);
        b.Property(x => x.RequesterNotifiedAt).HasColumnType("datetime2(0)");
        b.HasIndex(x => x.RequestNo).IsUnique();
        b.HasOne<Users>().WithMany().HasForeignKey(x => x.ProposedByUserId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Roles>().WithMany().HasForeignKey(x => x.SourceRoleId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<ApprovalRequestStatuses>().WithMany().HasForeignKey(x => x.StatusId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Users>().WithMany().HasForeignKey(x => x.ProcurementDecisionBy).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
        b.HasOne<Vendors>().WithMany().HasForeignKey(x => x.CreatedVendorId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
        b.HasOne<Users>().WithMany().HasForeignKey(x => x.ProcurementHodDecisionBy).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
    }
}
