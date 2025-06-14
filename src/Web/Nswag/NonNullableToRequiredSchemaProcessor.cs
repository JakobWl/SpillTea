using NJsonSchema;
using NJsonSchema.Generation;

namespace SpillTea.Web.Nswag;

/**
 * Makes sure that the generated types aren't both `null` and `undefined`.
 * Reportedly related issue: https://github.com/RicoSuter/NSwag/issues/3260
 */
public class NonNullableToRequiredSchemaProcessor : ISchemaProcessor
{
    public void Process(SchemaProcessorContext context)
    {
        foreach (var (_, prop) in context.Schema.ActualProperties)
        {
            if (!prop.IsNullable(SchemaType.OpenApi3))
            {
                prop.IsRequired = true;
            }
            else if (prop.IsNullable(SchemaType.OpenApi3))
            {
                prop.IsNullableRaw = false;
                prop.IsRequired = false;
            }

            if (prop is { HasOneOfSchemaReference: true, OneOf.Count: 1 } && prop.OneOf.First().Reference is not null)
            {
                prop.Reference = prop.OneOf.First().Reference;
                prop.OneOf.Clear();
                if (prop.IsNullable(SchemaType.OpenApi3))
                    prop.IsNullableRaw = null;
            }
        }
    }
}
