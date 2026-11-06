using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class PrCommentsConfiguration : IEntityTypeConfiguration<PrComments>
{
    public void Configure(EntityTypeBuilder<PrComments> b)
    {
        b.ToTable("PrComments");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.PrId).IsRequired();
        b.Property(x => x.CommentTypeId).IsRequired();
        b.Property(x => x.AuthorUserId).IsRequired();
        b.Property(x => x.Body).HasMaxLength(2000).IsRequired();
        b.Property(x => x.ParentCommentId);
        b.HasOne<PurchaseRequisitions>().WithMany().HasForeignKey(x => x.PrId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<CommentTypes>().WithMany().HasForeignKey(x => x.CommentTypeId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Users>().WithMany().HasForeignKey(x => x.AuthorUserId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<PrComments>().WithMany().HasForeignKey(x => x.ParentCommentId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
    }
}
