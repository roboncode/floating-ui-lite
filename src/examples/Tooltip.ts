import {
    Placement,
    arrow,
    computePosition,
    flip,
    shift
} from '../index';

export class Tooltip {
  private reference: HTMLElement;
  private floating: HTMLElement;
  private arrow: HTMLElement;
  private placement: Placement;
  private cleanup: (() => void) | null = null;

  constructor(
    reference: HTMLElement,
    content: string,
    placement: Placement = 'top'
  ) {
    this.reference = reference;
    this.placement = placement;

    // Create tooltip element
    this.floating = document.createElement('div');
    this.floating.className = 'tooltip';
    this.floating.textContent = content;

    // Create arrow element
    this.arrow = document.createElement('div');
    this.arrow.className = 'tooltip-arrow';
    this.floating.appendChild(this.arrow);

    // Add styles
    this.addStyles();

    // Setup event listeners
    this.reference.addEventListener('mouseenter', this.show);
    this.reference.addEventListener('mouseleave', this.hide);
  }

  private addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .tooltip {
        position: absolute;
        background: #333;
        color: white;
        padding: 8px;
        border-radius: 4px;
        font-size: 14px;
        pointer-events: none;
        transition: opacity 0.2s;
        opacity: 0;
        z-index: 1000;
      }

      .tooltip-arrow {
        position: absolute;
        width: 8px;
        height: 8px;
        background: #333;
        transform: rotate(45deg);
      }
    `;
    document.head.appendChild(style);
  }

  private update = async () => {
    const { x, y, placement, middlewareData } = await computePosition(
      this.reference,
      this.floating,
      {
        placement: this.placement,
        middleware: [
          flip(),
          shift({ padding: 5 }),
          arrow({ element: this.arrow, padding: 5 })
        ]
      }
    );

    Object.assign(this.floating.style, {
      left: `${x}px`,
      top: `${y}px`
    });

    const { x: arrowX, y: arrowY } = middlewareData.arrow;

    Object.assign(this.arrow.style, {
      left: arrowX != null ? `${arrowX}px` : '',
      top: arrowY != null ? `${arrowY}px` : '',
      [placement.includes('top') ? 'bottom' : 'top']: '-4px',
      [placement.includes('left') ? 'right' : 'left']: '-4px'
    });
  };

  private show = () => {
    document.body.appendChild(this.floating);
    this.floating.style.opacity = '1';
    
    // Setup update loop
    let frame: number;
    const update = () => {
      this.update();
      frame = requestAnimationFrame(update);
    };
    update();

    // Cleanup function
    this.cleanup = () => {
      cancelAnimationFrame(frame);
      this.floating.remove();
      this.floating.style.opacity = '0';
    };
  };

  private hide = () => {
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }
  };

  destroy() {
    this.reference.removeEventListener('mouseenter', this.show);
    this.reference.removeEventListener('mouseleave', this.hide);
    this.hide();
  }
} 