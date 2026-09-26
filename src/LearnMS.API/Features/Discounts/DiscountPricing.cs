using LearnMS.API.Entities;

namespace LearnMS.API.Features.Discounts;

public static class DiscountPricing
{
    public static bool Applies(StudentDiscount? discount, DiscountTarget target)
    {
        return discount is not null
            && discount.Percentage > 0
            && (discount.AppliesTo == DiscountTarget.Both || discount.AppliesTo == target);
    }

    public static decimal Apply(decimal price, StudentDiscount? discount, DiscountTarget target)
    {
        if (!Applies(discount, target))
            return price;

        var charged = price * (100m - discount!.Percentage) / 100m;
        if (charged < 0)
            charged = 0;

        return decimal.Round(charged, 2, MidpointRounding.AwayFromZero);
    }
}
