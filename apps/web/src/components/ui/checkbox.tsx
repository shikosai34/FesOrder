import * as React from "react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

function Checkbox({
	className,
	...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
	return (
		<CheckboxPrimitive.Root
			data-slot="checkbox"
			className={cn(
				"peer size-[20px] shrink-0 border-black border-thick bg-white transition-all outline-none",
				"data-[state=checked]:bg-black data-[state=checked]:text-white",
				"focus-visible:border-heavy focus-visible:ring-0",
				"disabled:cursor-not-allowed disabled:border-[#CCCCCC] disabled:bg-[#F5F5F5]",
				className,
			)}
			{...props}
		>
			<CheckboxPrimitive.Indicator
				data-slot="checkbox-indicator"
				className="flex items-center justify-center text-current transition-none [&_svg]:stroke-[3px]"
			>
				<CheckIcon className="size-3.5" />
			</CheckboxPrimitive.Indicator>
		</CheckboxPrimitive.Root>
	);
}

export { Checkbox };
