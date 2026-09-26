using LearnMS.API.Common;

namespace LearnMS.API.Features.Discounts;

public static class DiscountsErrors
{
    public static readonly ApiError NotFound = new(
        "discount/not-found",
        "Discount not found.",
        StatusCodes.Status404NotFound);

    public static readonly ApiError StudentNotFound = new(
        "discount/student-not-found",
        "One or more selected students were not found.",
        StatusCodes.Status404NotFound);

    public static readonly ApiError InvalidPercentage = new(
        "discount/invalid-percentage",
        "Discount percentage must be greater than 0 and at most 100.",
        StatusCodes.Status400BadRequest);

    public static readonly ApiError NoStudents = new(
        "discount/no-students",
        "Choose at least one student.",
        StatusCodes.Status400BadRequest);
}
