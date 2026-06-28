import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
	return (
		<input
			type={type}
			data-slot="input"
			className={cn(
				"flex w-full bg-[#F0F0F0] text-black border-black border-thick px-[12px] py-[10px] font-mono text-[15px] transition-all outline-none",
				"placeholder:text-muted-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium",
				"hover:bg-[#E8E8E8]",
				"focus-visible:border-heavy focus-visible:ring-0",
				"aria-invalid:border-destructive aria-invalid:border-thick",
				"disabled:pointer-events-none disabled:border-[#CCCCCC] disabled:bg-[#F5F5F5]",
				className,
			)}
			{...props}
		/>
	);
}

export { Input };
