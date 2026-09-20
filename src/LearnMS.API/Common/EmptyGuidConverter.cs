using System.Text.Json;
using System.Text.Json.Serialization;

namespace LearnMS.API.Common;

/// <summary>
/// Treats empty, invalid, or default GUID strings as null so quiz create/update
/// does not throw a 500 during JSON deserialization.
/// </summary>
public sealed class EmptyGuidConverter : JsonConverter<Guid?>
{
    public override Guid? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null)
            return null;

        if (reader.TokenType == JsonTokenType.String)
        {
            var value = reader.GetString();
            if (string.IsNullOrWhiteSpace(value))
                return null;
            return Guid.TryParse(value, out var guid) && guid != Guid.Empty ? guid : null;
        }

        if (reader.TokenType == JsonTokenType.StartObject)
        {
            reader.Skip();
            return null;
        }

        return reader.TryGetGuid(out var parsed) && parsed != Guid.Empty ? parsed : null;
    }

    public override void Write(Utf8JsonWriter writer, Guid? value, JsonSerializerOptions options)
    {
        if (value is null || value == Guid.Empty)
            writer.WriteNullValue();
        else
            writer.WriteStringValue(value.Value);
    }
}
