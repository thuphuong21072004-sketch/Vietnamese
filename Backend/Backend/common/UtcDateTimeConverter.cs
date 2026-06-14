using System.Text.Json;
using System.Text.Json.Serialization;

namespace Backend.Common;

/// <summary>
/// Forces all DateTime values serialized to JSON to carry a "Z" (UTC) suffix,
/// so Angular's date pipe can correctly convert them to the user's local timezone.
/// EF Core reads DateTime from SQL Server as Kind=Unspecified; this converter
/// treats them as UTC before sending to the frontend.
/// </summary>
public class UtcDateTimeConverter : JsonConverter<DateTime>
{
    public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetDateTime();
        return DateTime.SpecifyKind(value, DateTimeKind.Utc);
    }

    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(DateTime.SpecifyKind(value, DateTimeKind.Utc));
    }
}
