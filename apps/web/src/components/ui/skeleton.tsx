import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="skeleton"
			className={cn("bg-[#F0F0F0] animate-pulse border-[1px] border-black", className)}
			{...props}
		/>
	);
}

export { Skeleton };
