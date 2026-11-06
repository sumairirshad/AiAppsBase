using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class DepartmentCategoriesConfiguration : IEntityTypeConfiguration<DepartmentCategories>
{
    public void Configure(EntityTypeBuilder<DepartmentCategories> b)
    {
        b.ToTable("DepartmentCategories");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.DepartmentId).IsRequired();
        b.Property(x => x.CategoryId).IsRequired();
        b.HasOne<Departments>().WithMany().HasForeignKey(x => x.DepartmentId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Categories>().WithMany().HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.NoAction).IsRequired();
    }
}
