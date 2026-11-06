using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class ItemRequestsConfiguration : IEntityTypeConfiguration<ItemRequests>
{
    public void Configure(EntityTypeBuilder<ItemRequests> b)
    {
        b.ToTable("ItemRequests");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.RequestType).HasMaxLength(10).IsRequired();
        b.Property(x => x.ProposedName).HasMaxLength(150).IsRequired();
        b.Property(x => x.CategoryId);
        b.Property(x => x.RequestedBy).IsRequired();
        b.Property(x => x.StatusId).IsRequired();
        b.Property(x => x.DecisionBy);
        b.Property(x => x.DecisionReason).HasMaxLength(500);
        b.Property(x => x.CreatedItemId);
        b.HasOne<Categories>().WithMany().HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
        b.HasOne<Users>().WithMany().HasForeignKey(x => x.RequestedBy).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<ApprovalRequestStatuses>().WithMany().HasForeignKey(x => x.StatusId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Users>().WithMany().HasForeignKey(x => x.DecisionBy).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
        b.HasOne<Items>().WithMany().HasForeignKey(x => x.CreatedItemId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
    }
}
