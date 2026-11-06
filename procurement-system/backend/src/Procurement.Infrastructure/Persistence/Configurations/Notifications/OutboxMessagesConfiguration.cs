using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class OutboxMessagesConfiguration : IEntityTypeConfiguration<OutboxMessages>
{
    public void Configure(EntityTypeBuilder<OutboxMessages> b)
    {
        b.ToTable("OutboxMessages");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.MessageType).HasMaxLength(60).IsRequired();
        b.Property(x => x.Payload).IsRequired();
        b.Property(x => x.CreatedAt).HasColumnType("datetime2(3)").IsRequired();
        b.Property(x => x.ProcessedAt).HasColumnType("datetime2(3)");
        b.Property(x => x.Attempts).IsRequired().HasDefaultValueSql("0").ValueGeneratedNever();
        b.Property(x => x.NextAttemptAt).HasColumnType("datetime2(3)");
        b.Property(x => x.LastError).HasMaxLength(1000);
    }
}
