import { AfterViewChecked, Component, ElementRef, ViewChild, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface ChatLink { label: string; url: string; params?: Record<string, string | number>; }

interface Faq {
  id: number;
  topic: string;
  q: string;
  a: string;
  keywords: string;
  link?: ChatLink;
}

interface ChatMessage {
  from: 'bot' | 'me';
  text: string;
  link?: ChatLink;
}

/**
 * EDIT THESE: answers about how the app works are accurate for this code.
 * Answers about delivery, returns and payment are placeholders, so please
 * replace them with your store's real policies.
 */
const FAQS: Faq[] = [
  { id: 1, topic: 'Orders', q: 'How do I place an order?', keywords: 'order buy place checkout purchase',
    a: 'Open a shoe, tap Buy now, fill in your details and confirm. Or add shoes to your cart and use Checkout to order them together.',
    link: { label: 'Browse shoes', url: '/products' } },
  { id: 2, topic: 'Orders', q: 'Where can I see my past orders?', keywords: 'orders history past track status',
    a: 'Open My Orders from the profile menu. You can search, filter by brand or date and sort the list.',
    link: { label: 'Open my orders', url: '/orders' } },
  { id: 3, topic: 'Orders', q: 'How do I get an invoice copy?', keywords: 'invoice bill receipt copy print pdf',
    a: 'An invoice is created when you place an order. You can also open one any time from My Orders using the Invoice copy button, then print it or save it as a PDF.',
    link: { label: 'My orders', url: '/orders' } },
  { id: 4, topic: 'Account', q: 'How do I save or change my address?', keywords: 'address shipping change edit save delivery',
    a: 'Go to Profile, then Shipping address. Saved addresses can be picked at checkout so you do not have to type them again.',
    link: { label: 'Manage addresses', url: '/profile', params: { tab: 'address' } } },
  { id: 5, topic: 'Account', q: 'How do I edit my profile or photo?', keywords: 'profile photo name email phone edit',
    a: 'Open your profile and tap Edit profile. You can also add or change your photo from the profile card.',
    link: { label: 'Edit profile', url: '/profile', params: { edit: 1 } } },
  { id: 6, topic: 'Shopping', q: 'How does the wishlist work?', keywords: 'wishlist save heart favourite favorite',
    a: 'Tap the heart on any shoe to save it. Your wishlist keeps them together so you can move a pair to your cart later.',
    link: { label: 'Open wishlist', url: '/wishlist' } },
  { id: 7, topic: 'Shopping', q: 'How do I find the right shoe quickly?', keywords: 'search filter size color brand price sort find',
    a: 'On the Shop page use the search box, then filter by brand, price, size, color or availability, and sort by name or price.',
    link: { label: 'Go to shop', url: '/products' } },
  { id: 8, topic: 'Shopping', q: 'Why can I not add a shoe to my cart?', keywords: 'stock out unavailable cart add disabled',
    a: 'Shoes marked Out of stock cannot be added to the cart. Save them to your wishlist and check back later.' },
  { id: 9, topic: 'Policies', q: 'How long does delivery take?', keywords: 'delivery shipping time days when arrive',
    a: 'Delivery time depends on your location. Please contact support for an estimate on your pincode.',
    link: { label: 'Contact support', url: '/contact' } },
  { id: 10, topic: 'Policies', q: 'Can I return or exchange a pair?', keywords: 'return exchange refund cancel replace',
    a: 'Please contact support with your invoice number and we will help you with returns, exchanges or cancellations.',
    link: { label: 'Contact support', url: '/contact' } },
  { id: 11, topic: 'Policies', q: 'Which payment options are available?', keywords: 'payment pay upi card cash cod money',
    a: 'Payment options are confirmed with you after you place an order. Contact support if you need details before ordering.',
    link: { label: 'Contact support', url: '/contact' } }
];

@Component({
  selector: 'app-help-center',
  imports: [RouterLink, FormsModule],
  templateUrl: './help-center.component.html',
  styleUrl: './help-center.component.css'
})
export class HelpCenterComponent implements AfterViewChecked {
  @ViewChild('thread') thread?: ElementRef<HTMLElement>;

  faqs = FAQS;
  topics = ['All', ...new Set(FAQS.map(f => f.topic))];

  // FAQ search + filter
  faqSearch = signal('');
  topic = signal('All');
  openId = signal<number | null>(null);

  visibleFaqs = computed(() => {
    const term = this.faqSearch().trim().toLowerCase();
    return this.faqs.filter(f =>
      (this.topic() === 'All' || f.topic === this.topic()) &&
      (!term || `${f.q} ${f.a} ${f.keywords}`.toLowerCase().includes(term))
    );
  });

  // Chat
  draft = '';
  typing = signal(false);
  messages = signal<ChatMessage[]>([
    { from: 'bot', text: 'Hi! I am the ShoeKart helper. Ask about orders, invoices, addresses or your wishlist, or pick a question below.' }
  ]);
  suggestions = ['Where is my invoice?', 'Change my address', 'How does the wishlist work?', 'Delivery time'];

  private shouldScroll = false;

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.thread) {
      const el = this.thread.nativeElement;
      el.scrollTop = el.scrollHeight;
      this.shouldScroll = false;
    }
  }

  toggleFaq(id: number): void {
    this.openId.set(this.openId() === id ? null : id);
  }

  send(text: string = this.draft): void {
    const msg = text.trim();
    if (!msg || this.typing()) return;

    this.messages.update(m => [...m, { from: 'me', text: msg }]);
    this.draft = '';
    this.typing.set(true);
    this.shouldScroll = true;

    setTimeout(() => {
      this.messages.update(m => [...m, this.reply(msg)]);
      this.typing.set(false);
      this.shouldScroll = true;
    }, 700);
  }

  /** Simple keyword match against the FAQ list (filler words ignored, keywords weigh more than question text). */
  private reply(text: string): ChatMessage {
    const filler = new Set(['where', 'what', 'when', 'which', 'how', 'can', 'could', 'does', 'did', 'the', 'and', 'for', 'with', 'you', 'your', 'are', 'was', 'have', 'has', 'get', 'got', 'find', 'want', 'need', 'please', 'help', 'about', 'there', 'this', 'that', 'from', 'into']);
    const words = text.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2 && !filler.has(w));
    let best: Faq | null = null;
    let bestScore = 0;

    for (const f of this.faqs) {
      const keys = f.keywords.toLowerCase().split(' ');
      const question = f.q.toLowerCase();
      let score = 0;
      for (const w of words) {
        if (keys.some(k => k === w || (w.length > 3 && (k.startsWith(w) || w.startsWith(k))))) score += 3;
        else if (question.includes(w)) score += 1;
      }
      if (score > bestScore) { best = f; bestScore = score; }
    }

    if (best) return { from: 'bot', text: best.a, link: best.link };
    return {
      from: 'bot',
      text: 'I am not sure about that one. Our support team can help you directly.',
      link: { label: 'Contact support', url: '/contact' }
    };
  }
}
