import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StoreProvider } from '../../state/store';
import { VerticalProvider, useVertical } from '../../state/verticalContext';
import { Toast } from '../../components/shared/Toast';
import { Knowledge } from '../Knowledge';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function KnowledgeWrapper({ vertical = 'commerce' }: { vertical?: 'commerce' | 'appointments' }) {
  const VerticalSetter = () => {
    const { setVertical } = useVertical();
    React.useEffect(() => {
      setVertical(vertical);
    }, [vertical]);
    return <Knowledge />;
  };

  return (
    <MemoryRouter>
      <StoreProvider>
        <VerticalProvider>
          <VerticalSetter />
          <Toast />
        </VerticalProvider>
      </StoreProvider>
    </MemoryRouter>
  );
}

describe('Knowledge page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).fetch = vi.fn(async (url: string) => {
      if (String(url).includes('/bootstrap')) {
        return { ok: false, status: 404 };
      }
      return { ok: true, json: async () => [] };
    });
  });

  it('renders correct tabs for commerce and appointments verticals', () => {
    const { rerender } = render(<KnowledgeWrapper vertical="commerce" />);
    expect(screen.getByRole('button', { name: /^faqs$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^products$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^policies$/i })).toBeInTheDocument();

    rerender(<KnowledgeWrapper vertical="appointments" />);
    expect(screen.getByRole('button', { name: /^faqs$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^services$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^policies$/i })).toBeInTheDocument();
  });

  it('filters FAQs by search input', () => {
    render(<KnowledgeWrapper vertical="commerce" />);

    // In initial store state, FAQs exist (e.g. shipping / delivery)
    const searchInput = screen.getByPlaceholderText(/search faqs\.\.\./i);
    fireEvent.change(searchInput, { target: { value: 'nonexistentqueryxyz' } });

    expect(screen.getByText('No FAQs found')).toBeInTheDocument();
  });

  it('asks knowledge base successfully and displays AI answer with source badge', async () => {
    (globalThis as any).fetch = vi.fn(async (url: string) => {
      if (String(url).includes('/knowledge/ask')) {
        return {
          ok: true,
          json: async () => ({
            answer: 'We deliver to Alexandria within 48 hours for 50 EGP.',
            source: 'micromind'
          })
        };
      }
      return { ok: true, json: async () => [] };
    });

    render(<KnowledgeWrapper vertical="commerce" />);

    const askInput = screen.getByPlaceholderText(/ask what a customer would ask/i);
    const askBtn = screen.getByRole('button', { name: /^ask$/i });

    expect(askBtn).toBeDisabled();

    fireEvent.change(askInput, { target: { value: 'Do you deliver to Alexandria?' } });
    expect(askBtn).not.toBeDisabled();

    fireEvent.click(askBtn);

    expect(await screen.findByText('We deliver to Alexandria within 48 hours for 50 EGP.')).toBeInTheDocument();
    expect(screen.getByText('via MicroMind AI')).toBeInTheDocument();
  });

  it('falls back to local response and warning toast when knowledge service is unreachable', async () => {
    (globalThis as any).fetch = vi.fn(async (url: string) => {
      if (String(url).includes('/knowledge/ask')) {
        return { ok: false, status: 500 };
      }
      return { ok: true, json: async () => [] };
    });

    render(<KnowledgeWrapper vertical="commerce" />);

    const askInput = screen.getByPlaceholderText(/ask what a customer would ask/i);
    fireEvent.change(askInput, { target: { value: 'How fast is shipping?' } });

    const askBtn = screen.getByRole('button', { name: /^ask$/i });
    fireEvent.click(askBtn);

    expect(await screen.findByText(/knowledge service unreachable — using local response/i)).toBeInTheDocument();
    expect(screen.getByText('via local match')).toBeInTheDocument();
  });

  it('enforces 8MB upload gate on file upload', async () => {
    render(<KnowledgeWrapper vertical="commerce" />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const largeFile = new File([new ArrayBuffer(9 * 1024 * 1024)], 'giant_doc.pdf', { type: 'application/pdf' });
    Object.defineProperty(fileInput, 'files', { value: [largeFile], configurable: true });
    fireEvent.change(fileInput);

    expect(await screen.findByText('File over 8MB — split it first')).toBeInTheDocument();
  });

  it('uploads valid knowledge file and shows success toast', async () => {
    (globalThis as any).fetch = vi.fn(async (url: string) => {
      if (String(url).includes('/knowledge/upload')) {
        return { ok: true, json: async () => ({ success: true, items: 5 }) };
      }
      return { ok: true, json: async () => [] };
    });

    render(<KnowledgeWrapper vertical="commerce" />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const testFile = new File(['FAQ catalog'], 'catalog.txt', { type: 'text/plain' });
    Object.defineProperty(fileInput, 'files', { value: [testFile], configurable: true });
    fireEvent.change(fileInput);

    expect(await screen.findByText('Added 5 knowledge items from catalog.txt')).toBeInTheDocument();
  });

  it('adds and deletes an FAQ with appropriate toasts', async () => {
    render(<KnowledgeWrapper vertical="commerce" />);

    const addBtn = screen.getAllByRole('button', { name: /^add faq$/i })[0];
    fireEvent.click(addBtn);

    const modal = screen.getByRole('heading', { name: 'Add FAQ' }).closest('div[style*="max-width"]') as HTMLElement;
    const questionInput = within(modal).getByPlaceholderText('Question (e.g. What are delivery hours?)');
    const answerInput = within(modal).getByPlaceholderText('Answer...');
    const submitBtn = within(modal).getByRole('button', { name: 'Add FAQ' });

    fireEvent.change(questionInput, { target: { value: 'Is cash on delivery available?' } });
    fireEvent.change(answerInput, { target: { value: 'Yes, across all Egypt governorates.' } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('FAQ added to knowledge base')).toBeInTheDocument();
    expect(screen.getByText('Is cash on delivery available?')).toBeInTheDocument();

    const deleteBtn = screen.getAllByTitle(/delete faq/i)[0];
    fireEvent.click(deleteBtn);

    expect(await screen.findByText('FAQ deleted')).toBeInTheDocument();
  });

  it('adds and deletes a business policy with API calls and toasts', async () => {
    (globalThis as any).fetch = vi.fn(async () => ({ ok: true, json: async () => ({ success: true }) }));

    render(<KnowledgeWrapper vertical="commerce" />);

    const policiesTab = screen.getByRole('button', { name: /^policies$/i });
    fireEvent.click(policiesTab);

    const addPolicyBtn = screen.getByRole('button', { name: /^add policy$/i });
    fireEvent.click(addPolicyBtn);

    const modal = screen.getByRole('heading', { name: 'Add Business Policy' }).closest('div[style*="max-width"]') as HTMLElement;
    const titleInput = within(modal).getByPlaceholderText(/policy title/i);
    const contentInput = within(modal).getByPlaceholderText(/policy details that ai must adhere to/i);
    const submitBtn = within(modal).getByRole('button', { name: 'Add Policy' });

    fireEvent.change(titleInput, { target: { value: 'Custom Guarantee Policy' } });
    fireEvent.change(contentInput, { target: { value: 'Full refund within 30 days.' } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Policy added to knowledge base')).toBeInTheDocument();
    expect(screen.getByText('Custom Guarantee Policy')).toBeInTheDocument();

    const deleteBtn = screen.getAllByTitle(/delete policy/i)[0];
    fireEvent.click(deleteBtn);

    expect(await screen.findByText('Policy deleted')).toBeInTheDocument();
  });

  it('navigates to catalog pages when Products/Services tabs are active', () => {
    const { rerender } = render(<KnowledgeWrapper vertical="commerce" />);

    const productsTab = screen.getByRole('button', { name: /^products$/i });
    fireEvent.click(productsTab);

    const manageBtn = screen.getByRole('button', { name: /manage products/i });
    fireEvent.click(manageBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/products');

    rerender(<KnowledgeWrapper vertical="appointments" />);

    const servicesTab = screen.getByRole('button', { name: /^services$/i });
    fireEvent.click(servicesTab);

    const manageServicesBtn = screen.getByRole('button', { name: /manage services/i });
    fireEvent.click(manageServicesBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/services');
  });

  it('manages sources rail items: adding and deleting sources', async () => {
    render(<KnowledgeWrapper vertical="commerce" />);

    const addSourceTrigger = screen.getByTitle('Add Source');
    fireEvent.click(addSourceTrigger);

    const modal = screen.getByRole('heading', { name: 'Add Knowledge Source' }).closest('div[style*="max-width"]') as HTMLElement;
    const nameInput = within(modal).getByPlaceholderText(/source name/i);
    fireEvent.change(nameInput, { target: { value: 'Product Specsheet 2026' } });

    const submitBtn = within(modal).getByRole('button', { name: 'Add Source' });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Source added')).toBeInTheDocument();
    expect(screen.getByText('Product Specsheet 2026')).toBeInTheDocument();

    const deleteBtn = screen.getAllByTitle('Delete source')[0];
    fireEvent.click(deleteBtn);

    expect(await screen.findByText('Source deleted')).toBeInTheDocument();
  });
});
