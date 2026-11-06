import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

describe('dashboard interactions', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('toggles dark mode with an accessible switch', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Abrir preferências de visualização' }))
    const toggle = screen.getByRole('switch', { name: 'Ativar modo escuro' })
    await user.click(toggle)

    expect(screen.getByRole('switch', { name: 'Ativar modo claro' })).toHaveAttribute('aria-checked', 'true')
    expect(document.querySelector('.app-shell')).toHaveClass('theme-dark')
  })

  it('keeps the navigation menu usable at mobile viewport sizes', async () => {
    const user = userEvent.setup()
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 })
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Abrir menu' }))

    const sidebar = screen.getByRole('navigation', { name: 'Navegação do painel' }).parentElement
    if (!sidebar) throw new Error('Expected the navigation inside the project sidebar.')
    expect(sidebar).toHaveClass('sidebar-open')
    await user.click(within(sidebar).getByRole('button', { name: 'Fechar menu' }))
    expect(sidebar).not.toHaveClass('sidebar-open')
  })

  it('lets visitors choose an environmental message using minimal dot controls', async () => {
    const user = userEvent.setup()
    render(<App />)

    const quoteCard = screen.getByRole('region', { name: 'Dicas e inspiração ambiental' })
    expect(within(quoteCard).getByText('Pequenas mudanças, grandes colheitas.')).toBeInTheDocument()

    await user.click(within(quoteCard).getByRole('button', { name: 'Mostrar dica 2: DICA DE PLANEJAMENTO' }))
    expect(within(quoteCard).getByText('Planejar as refeições ajuda a aproveitar melhor cada alimento.')).toBeInTheDocument()
    expect(within(quoteCard).getAllByRole('button')).toHaveLength(6)
    expect(within(quoteCard).getByRole('button', { name: 'Mostrar dica 2: DICA DE PLANEJAMENTO' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(quoteCard).queryByRole('button', { name: /frase anterior|próxima frase|pausar rotação/i })).not.toBeInTheDocument()
  })

  it('filters indicators by area and keeps a zero-result message for unmatched activities', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.selectOptions(screen.getByLabelText('Frente'), 'compostagem')

    const indicators = screen.getByRole('region', { name: 'Indicadores principais' })
    expect(within(indicators).getByText('Composteiras implantadas')).toBeInTheDocument()
    expect(within(indicators).queryByText('Famílias com redução percebida de desperdício')).not.toBeInTheDocument()
  })

  it('adds a dated measurement and displays only real history in the chart', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByText('O histórico começa com a primeira medição')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Registrar medição' }))
    const dialog = screen.getByRole('dialog', { name: 'Registrar dado observado' })
    await user.selectOptions(within(dialog).getByLabelText('Indicador'), 'wasteReduction')
    await user.type(within(dialog).getByLabelText('Resultado'), '72')
    await user.clear(within(dialog).getByLabelText('Data da medição'))
    await user.type(within(dialog).getByLabelText('Data da medição'), '2025-05-10')
    await user.click(within(dialog).getByRole('button', { name: 'Salvar medição' }))

    expect(screen.queryByText('O histórico começa com a primeira medição')).not.toBeInTheDocument()
    expect(screen.getByText('1 medições datadas registradas')).toBeInTheDocument()
    expect(localStorage.getItem('raiz-cuidado-indicator-measurements')).toContain('"value":72')
  })

  it('requires explicit consent before publishing a testimonial', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('Depoimento autorizado'), 'Aprendi novas formas de aproveitar alimentos.')
    await user.click(screen.getByRole('button', { name: 'Registrar depoimento' }))

    expect(screen.getByText('Confirme que possui autorização explícita antes de registrar um depoimento.')).toBeInTheDocument()
    expect(screen.queryByText('“Aprendi novas formas de aproveitar alimentos.”')).not.toBeInTheDocument()
  })

  it('exports a filtered CSV through the browser download API', async () => {
    const user = userEvent.setup()
    const createObjectURL = vi.fn(() => 'blob:report')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    render(<App />)

    await user.selectOptions(screen.getByLabelText('Frente'), 'compostagem')
    await user.click(screen.getByRole('button', { name: 'Exportar CSV filtrado' }))

    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(screen.getByText('Relatório baixado')).toBeInTheDocument()
  })
})
