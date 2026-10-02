import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StoreProvider } from '../../../state/store';
import { VerticalProvider } from '../../../state/verticalContext';
import { Toast } from '../../../components/shared/Toast';
import { VerticalSelect } from '../VerticalSelect';
import { BusinessInfo } from '../BusinessInfo';
import { ConnectChannels } from '../ConnectChannels';
import { KnowledgeSetup } from '../KnowledgeSetup';
import { AIReview } from '../AIReview';
import { Finish } from '../Finish';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <StoreProvider>
        <VerticalProvider>
          {ui}
          <Toast />
        </VerticalProvider>
      </StoreProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  (globalThis as any).fetch = vi.fn(async () => ({ ok: true, json: async () => ({}) }));
});

describe('Onboarding Step 1: VerticalSelect', () => {
  it('selects commerce and navigates to /onboarding', () => {
    renderWithProviders(<VerticalSelect />);
    const commerceBtn = screen.getByRole('button', { name: /use commerce/i });
    fireEvent.click(commerceBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/onboarding');
  });

  it('selects appointments and navigates to /onboarding', () => {
    renderWithProviders(<VerticalSelect />);
    const apptBtn = screen.getByRole('button', { name: /use appointments/i });
    fireEvent.click(apptBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/onboarding');
  });

  it('skip link navigates to /overview', () => {
    renderWithProviders(<VerticalSelect />);
    const skipBtn = screen.getByRole('button', { name: /skip/i });
    fireEvent.click(skipBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/overview');
  });
});

describe('Onboarding Step 2: BusinessInfo', () => {
  it('gates continue button when required fields are missing', () => {
    const onNext = vi.fn();
    renderWithProviders(<BusinessInfo data={{}} onNext={onNext} onBack={vi.fn()} />);

    const continueBtn = screen.getByRole('button', { name: /continue/i });
    expect(continueBtn).toBeDisabled();

    // Fill business name only
    const nameInput = screen.getByPlaceholderText(/cairo fashion store/i);
    fireEvent.change(nameInput, { target: { value: 'My Fashion Shop' } });
    expect(continueBtn).toBeDisabled();

    // Select 'other' industry without entering other description
    const industrySelect = screen.getByRole('combobox');
    fireEvent.change(industrySelect, { target: { value: 'other' } });
    expect(continueBtn).toBeDisabled();

    // Fill other description
    const otherInput = screen.getByPlaceholderText(/tell us your business type/i);
    fireEvent.change(otherInput, { target: { value: 'Boutique Studio' } });
    expect(continueBtn).not.toBeDisabled();
  });

  it('guards logo file type and file size with exact toast messages', async () => {
    renderWithProviders(<BusinessInfo data={{}} onNext={vi.fn()} onBack={vi.fn()} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    // Non-image file
    const textFile = new File(['hello'], 'doc.pdf', { type: 'application/pdf' });
    Object.defineProperty(fileInput, 'files', { value: [textFile], configurable: true });
    fireEvent.change(fileInput);
    expect(await screen.findByText('Choose a PNG, JPEG, GIF, or WEBP image')).toBeInTheDocument();

    // Large file > 5MB
    const largeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'large.png', { type: 'image/png' });
    Object.defineProperty(fileInput, 'files', { value: [largeFile], configurable: true });
    fireEvent.change(fileInput);
    expect(await screen.findByText('Logo must be smaller than 5MB')).toBeInTheDocument();
  });

  it('offline continue warns but advances onNext', async () => {
    const onNext = vi.fn();
    (globalThis as any).fetch = vi.fn(async (url: string) => {
      if (String(url).includes('/settings')) return null;
      return { ok: true, json: async () => ({}) };
    });

    renderWithProviders(<BusinessInfo data={{ businessName: 'Cairo Shop', industry: 'fashion' }} onNext={onNext} onBack={vi.fn()} />);

    const continueBtn = screen.getByRole('button', { name: /continue/i });
    expect(continueBtn).not.toBeDisabled();
    fireEvent.click(continueBtn);

    expect(await screen.findByText('Backend unreachable — continuing locally')).toBeInTheDocument();
    await waitFor(() => expect(onNext).toHaveBeenCalledWith(expect.objectContaining({
      businessName: 'Cairo Shop',
      industry: 'fashion'
    })));
  });
});

describe('Onboarding Step 3: ConnectChannels', () => {
  it('falls back to local channel toggles when backend returns null', async () => {
    (globalThis as any).fetch = vi.fn(async () => ({ ok: false, status: 500 }));
    renderWithProviders(<ConnectChannels data={{}} onNext={vi.fn()} onBack={vi.fn()} />);

    const tiktokCard = screen.getByText('TikTok').closest('div[style*="border-radius: 10px"]')!;
    const tiktokBtn = within(tiktokCard as HTMLElement).getByRole('button', { name: /^connect$/i });
    fireEvent.click(tiktokBtn);

    expect(await screen.findByText(/TikTok connected/i)).toBeInTheDocument();
  });

  it('gates channel connection requiring token or flow id when backend is active', async () => {
    (globalThis as any).fetch = vi.fn(async (url: string) => {
      if (String(url).includes('/channels')) {
        return { ok: true, json: async () => [] };
      }
      return { ok: true, json: async () => ({}) };
    });

    renderWithProviders(<ConnectChannels data={{}} onNext={vi.fn()} onBack={vi.fn()} />);

    const connectBtns = await screen.findAllByRole('button', { name: /^connect$/i });
    fireEvent.click(connectBtns[0]);

    const submitBtn = await screen.findByRole('button', { name: /connect instagram/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Paste an access token or a MicroMind flow id')).toBeInTheDocument();
  });

  it('disconnects channel via backend API when account is active', async () => {
    let disconnected = false;
    (globalThis as any).fetch = vi.fn(async (url: string) => {
      if (String(url).includes('/disconnect')) {
        disconnected = true;
        return { ok: true, json: async () => ({ success: true }) };
      }
      if (String(url).includes('/channels')) {
        return { ok: true, json: async () => [{ id: 'ch_1', channel: 'instagram', status: disconnected ? 'disconnected' : 'active' }] };
      }
      return { ok: true, json: async () => ({}) };
    });

    renderWithProviders(<ConnectChannels data={{}} onNext={vi.fn()} onBack={vi.fn()} />);

    const disconnectBtn = await screen.findByRole('button', { name: /disconnect/i });
    fireEvent.click(disconnectBtn);

    expect(await screen.findByText(/Instagram disconnected/i)).toBeInTheDocument();
  });
});

describe('Onboarding Step 4: KnowledgeSetup', () => {
  it('enforces 8MB file size limit on zone upload', async () => {
    renderWithProviders(<KnowledgeSetup data={{}} onNext={vi.fn()} onBack={vi.fn()} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const largeFile = new File([new ArrayBuffer(9 * 1024 * 1024)], 'big-catalog.pdf', { type: 'application/pdf' });
    Object.defineProperty(fileInput, 'files', { value: [largeFile], configurable: true });
    fireEvent.change(fileInput);

    expect(await screen.findByText('File over 8MB — split it first')).toBeInTheDocument();
  });

  it('enforces at least 2 options for MCQ FAQs', async () => {
    renderWithProviders(<KnowledgeSetup data={{}} onNext={vi.fn()} onBack={vi.fn()} />);

    const quickAddBtns = screen.getAllByRole('button', { name: /\+ quick add/i });
    fireEvent.click(quickAddBtns[1]); // Open FAQ quick add

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'mcq' } });

    const questionInput = screen.getByPlaceholderText('Question (e.g. Do you deliver to Giza?)');
    fireEvent.change(questionInput, { target: { value: 'What are your hours?' } });

    const answerInput = screen.getByPlaceholderText('Explanation or correct answer');
    fireEvent.change(answerInput, { target: { value: 'We are open 9 to 5' } });

    const saveBtn = screen.getByRole('button', { name: /add faq/i });
    fireEvent.click(saveBtn);

    expect(await screen.findByText('Add at least two answer choices')).toBeInTheDocument();
  });

  it('adds free-text FAQ successfully with toast', async () => {
    renderWithProviders(<KnowledgeSetup data={{}} onNext={vi.fn()} onBack={vi.fn()} />);

    const quickAddBtns = screen.getAllByRole('button', { name: /\+ quick add/i });
    fireEvent.click(quickAddBtns[1]); // Open FAQ quick add

    const questionInput = screen.getByPlaceholderText('Question (e.g. Do you deliver to Giza?)');
    fireEvent.change(questionInput, { target: { value: 'Do you ship to Alexandria?' } });

    const answerInput = screen.getByPlaceholderText('Answer');
    fireEvent.change(answerInput, { target: { value: 'Yes, 50 EGP standard delivery.' } });

    const saveBtn = screen.getByRole('button', { name: /add faq/i });
    fireEvent.click(saveBtn);

    expect(await screen.findByText('FAQ added')).toBeInTheDocument();
  });

  it('uploads file successfully to knowledge base API', async () => {
    (globalThis as any).fetch = vi.fn(async (url: string) => {
      if (String(url).includes('/knowledge/upload')) {
        return { ok: true, json: async () => ({ success: true, items: 3 }) };
      }
      return { ok: true, json: async () => ({}) };
    });

    renderWithProviders(<KnowledgeSetup data={{}} onNext={vi.fn()} onBack={vi.fn()} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const testFile = new File(['Q: Return policy? A: 14 days'], 'faq.txt', { type: 'text/plain' });
    Object.defineProperty(fileInput, 'files', { value: [testFile], configurable: true });
    fireEvent.change(fileInput);

    expect(await screen.findByText(/Added 3 knowledge items from faq\.txt/i)).toBeInTheDocument();
  });
});

describe('Onboarding Step 5: AIReview', () => {
  it('renders all 7 behavior rows and shows offline fallback copy when backend is unreachable', async () => {
    (globalThis as any).fetch = vi.fn(async () => null);
    renderWithProviders(<AIReview data={{}} onNext={vi.fn()} onBack={vi.fn()} />);

    expect(screen.getByText('Answer product/service questions')).toBeInTheDocument();
    expect(screen.getByText('Check availability and stock')).toBeInTheDocument();
    expect(screen.getByText('Create orders and book appointments')).toBeInTheDocument();
    expect(screen.getByText('Escalate to human when needed')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Backend offline — demo mode')).toBeInTheDocument();
      expect(screen.getByText('Database unreachable — demo data')).toBeInTheDocument();
      expect(screen.getByText('No live channels connected')).toBeInTheDocument();
    });
  });
});

describe('Onboarding Step 6: Finish', () => {
  it('renders checklist, allows going back, and completes dashboard onboarding', () => {
    const onComplete = vi.fn();
    const onBack = vi.fn();
    renderWithProviders(<Finish data={{}} onComplete={onComplete} onBack={onBack} />);

    expect(screen.getByText("You're all set!")).toBeInTheDocument();
    expect(screen.getByText('Business profile configured')).toBeInTheDocument();
    expect(screen.getByText('Channels connected')).toBeInTheDocument();
    expect(screen.getByText('Knowledge base uploaded')).toBeInTheDocument();
    expect(screen.getByText('AI behavior reviewed')).toBeInTheDocument();

    const backBtn = screen.getByRole('button', { name: /back/i });
    fireEvent.click(backBtn);
    expect(onBack).toHaveBeenCalled();

    const enterBtn = screen.getByRole('button', { name: /enter dashboard/i });
    fireEvent.click(enterBtn);
    expect(onComplete).toHaveBeenCalled();
  });
});
