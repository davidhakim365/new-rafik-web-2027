using LearnMS.API.Entities;

namespace LearnMS.API.Features.Discounts;

public readonly record struct AppliedDiscount(decimal Percentage, DiscountTarget AppliesTo);

public static class DiscountPricing
{
    /// <summary>
    /// A lecture discount replaces the student's general discount for that lecture only.
    /// </summary>
    public static AppliedDiscount? Resolve(StudentDiscount? general, LectureStudentDiscount? lectureDiscount)
    {
        if (lectureDiscount is { Percentage: > 0 })
            return new AppliedDiscount(lectureDiscount.Percentage, lectureDiscount.AppliesTo);

        if (general is { Percentage: > 0 })
            return new AppliedDiscount(general.Percentage, general.AppliesTo);

        return null;
    }

    public static bool Applies(StudentDiscount? discount, DiscountTarget target)
        => Applies(ToApplied(discount), target);

    public static bool Applies(AppliedDiscount? discount, DiscountTarget target)
    {
        return discount is { Percentage: > 0 } value
            && (value.AppliesTo == DiscountTarget.Both || value.AppliesTo == target);
    }

    public static decimal Apply(decimal price, StudentDiscount? discount, DiscountTarget target)
        => Apply(price, ToApplied(discount), target);

    public static decimal Apply(
        decimal price,
        StudentDiscount? general,
        LectureStudentDiscount? lectureDiscount,
        DiscountTarget target)
        => Apply(price, Resolve(general, lectureDiscount), target);

    public static decimal Apply(decimal price, AppliedDiscount? discount, DiscountTarget target)
    {
        if (!Applies(discount, target))
            return price;

        var charged = price * (100m - discount!.Value.Percentage) / 100m;
        if (charged < 0)
            charged = 0;

        return decimal.Round(charged, 2, MidpointRounding.AwayFromZero);
    }

    private static AppliedDiscount? ToApplied(StudentDiscount? discount)
        => discount is null ? null : new AppliedDiscount(discount.Percentage, discount.AppliesTo);
}
