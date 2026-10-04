/**
 * Injects a JSON-LD <script> tag. Schema values can carry user text (product
 * titles, seller bios), so `<` is escaped to stop a `</script>` breaking out.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
