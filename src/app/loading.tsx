export default function Loading() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
            <div className="w-full max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                    <div className="size-10 animate-pulse rounded-lg bg-sky-100" />
                    <div className="space-y-2">
                        <div className="h-4 w-32 animate-pulse rounded-full bg-slate-200" />
                        <div className="h-3 w-48 animate-pulse rounded-full bg-slate-100" />
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="h-28 animate-pulse rounded-lg bg-slate-100" />
                    <div className="h-28 animate-pulse rounded-lg bg-slate-100" />
                    <div className="h-28 animate-pulse rounded-lg bg-slate-100" />
                </div>

                <div className="mt-6 space-y-3">
                    <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
                    <div className="h-4 w-11/12 animate-pulse rounded-full bg-slate-100" />
                    <div className="h-4 w-9/12 animate-pulse rounded-full bg-slate-100" />
                </div>
            </div>
        </div>
    );
}
