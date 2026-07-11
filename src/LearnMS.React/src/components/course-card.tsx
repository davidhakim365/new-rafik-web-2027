import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Coins } from "lucide-react";
import { Link } from "react-router-dom";

const course = {
  name: "Course Name",
  description: "Course Description",
  coverUrl: "https://via.placeholder.com/150",
  price: 100,
  renewPrice: 200,
};

type CourseCardProps = { course: typeof course };

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const { name, description, coverUrl, price, renewPrice } = course;

  return (
    <Link to="/courses/some-course-id">
      <Card className="transition hover:scale-105 hover:cursor-pointer">
        <CardHeader>
          <CardTitle>{name}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <img
            src={coverUrl}
            alt=""
            className="object-cover w-full h-full rounded-lg"
          />
        </CardContent>
        <CardFooter className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/20">
              <Coins className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            </span>
            Price
          </span>
          {renewPrice ? (
            <>
              <p className="ml-auto mr-2 line-through text-muted-foreground">
                ${price}
              </p>
              <p className="font-semibold text-amber-600 dark:text-amber-500">
                ${renewPrice}
              </p>
            </>
          ) : (
            <>
              <p className="ml-auto font-semibold text-end text-amber-600 dark:text-amber-500">
                ${price}
              </p>
            </>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
};

export default CourseCard;
