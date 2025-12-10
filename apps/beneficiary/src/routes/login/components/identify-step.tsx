import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/login/components/identify-step')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/login/components/identify-step"!</div>
}
