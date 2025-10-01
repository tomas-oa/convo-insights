import { ArrowLeftIcon } from "lucide-react"
import { Link, useLocation } from "react-router-dom";

function NotFound() {
  const path = useLocation()

  return (
    <div className="min-h-screen px-4 py-16 sm:px-6 sm:py-24 md:grid md:place-items-center lg:px-8">
      <div className="mx-auto max-w-max">
        <main className="sm:flex">
          <p className="text-4xl font-bold tracking-tight text-skin-600 sm:text-5xl">👷‍♂️🏗</p>
          <div className="sm:ml-6">
            <div className="sm:border-l sm:border-gray-200 dark:sm:border-gray-800 sm:pl-6">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl">
                Error 404 — Página no encontrada
              </h1>
              <pre className={"mt-1 text-base text-gray-500"}>{path["pathname"]}</pre>
              <p className="mt-2 text-base text-gray-500">Quizás el link expiró o está mal escrito.</p>
            </div>
            <div className="mt-10 flex flex-row flex-wrap sm:border-l sm:border-transparent sm:pl-6">
              <Link
                to="/"
                className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded text-sm"
              >
                <ArrowLeftIcon className="size-4" />

                Volver al inicio
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default NotFound;
