using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class MarketSurveysConfiguration : IEntityTypeConfiguration<MarketSurveys>
{
    public void Configure(EntityTypeBuilder<MarketSurveys> b)
    {
        b.ToTable("MarketSurveys");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.ItemId).IsRequired();
        b.Property(x => x.LocationId);
        b.Property(x => x.SurveyedPrice).HasColumnType("decimal(18,2)").IsRequired();
        b.Property(x => x.CurrencyCode).HasMaxLength(3).IsFixedLength().IsRequired().HasDefaultValueSql("'PKR'").ValueGeneratedNever();
        b.Property(x => x.Source).HasMaxLength(150).IsRequired();
        b.Property(x => x.SurveyedOn).IsRequired();
        b.Property(x => x.SurveyedBy).IsRequired();
        b.Property(x => x.IsStale).IsRequired().HasDefaultValueSql("0").ValueGeneratedNever();
        b.HasOne<Items>().WithMany().HasForeignKey(x => x.ItemId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Locations>().WithMany().HasForeignKey(x => x.LocationId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
        b.HasOne<Currencies>().WithMany().HasForeignKey(x => x.CurrencyCode).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Users>().WithMany().HasForeignKey(x => x.SurveyedBy).OnDelete(DeleteBehavior.NoAction).IsRequired();
    }
}
