using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace LearnMS.API.Entities;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum Permission
{
    ManageCourses,
    ManageStudents,
    ManageLecture,
    ManageCreditCodes,
    GenerateCreditCodes,
    ManageAssistants,
    ManageFiles,
    ViewStatistics
}
