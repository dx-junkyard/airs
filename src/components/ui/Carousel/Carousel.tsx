import type { ComponentProps, KeyboardEvent, Ref } from 'react';
import Disclosure from '@/components/ui/Disclosure/Disclosure';
import DisclosureSummary from '@/components/ui/Disclosure/DisclosureSummary';

// Common Types
// ==============================

type CarouselImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

type CarouselImageSource = {
  srcSet: string;
  width?: number;
  height?: number;
  media: string;
};

export type CarouselSlide = {
  id: string;
  label: string;
  href: string;
  target?: string;
  image: CarouselImage;
  imageSources?: CarouselImageSource[];
};

// Carousel Sub Components
// ==============================

type CarouselStepNavProps = {
  slides: CarouselSlide[];
  selectedIndex: number;
  unit: string;
  onStepSelect: (index: number) => void;
};

const CarouselStepNav = (props: CarouselStepNavProps) => {
  const { slides, selectedIndex, unit, onStepSelect } = props;

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    const isNext = event.key === 'ArrowRight' || event.key === 'ArrowDown';
    const isPrev = event.key === 'ArrowLeft' || event.key === 'ArrowUp';

    if (!isNext && !isPrev) return;

    event.preventDefault();

    const direction = isNext ? 1 : -1;
    const nextIndex = (index + direction + slides.length) % slides.length;

    onStepSelect(nextIndex);

    const list = event.currentTarget.closest('[role="tablist"]');
    const tabs = list?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    const target = tabs?.[nextIndex];
    target?.focus();
  };

  return (
    <ul
      className="relative flex justify-end gap-4"
      // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: Correct tablist usage
      role="tablist"
      aria-label={`${unit}選択`}
    >
      {slides.map((slide, index) => {
        const isSelected = index === selectedIndex;
        const tabAttributes = {
          role: 'tab' as const,
          'aria-selected': isSelected,
          tabIndex: isSelected ? 0 : -1,
        };

        return (
          <li
            key={slide.id}
            className={`
              relative shrink-0
              before:absolute before:top-1/2 before:left-full before:w-4
              before:border-b before:border-solid-gray-800
              last:before:hidden
            `}
            role="presentation"
          >
            <button
              {...tabAttributes}
              type="button"
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={`
                font-inherit text-oln-16B-100 relative flex size-8
                cursor-default items-center justify-center rounded-full border
                border-solid-gray-800 bg-white pb-0.5 text-solid-gray-800
                after:absolute after:-inset-[calc(7/16*1rem)]
                focus-visible:ring-[calc(2/16*1rem)]
                focus-visible:ring-yellow-300! focus-visible:outline-4!
                focus-visible:outline-offset-[calc(2/16*1rem)]
                focus-visible:outline-black! focus-visible:outline-solid
                aria-selected:bg-solid-gray-800 aria-selected:text-white
                aria-selected:ring-[calc(2/16*1rem)] aria-selected:ring-white
                aria-selected:outline-1
                aria-selected:outline-offset-[calc(2/16*1rem)]
                aria-selected:outline-solid-gray-800 aria-selected:outline-solid
                aria-[selected=false]:underline
                aria-[selected=false]:decoration-1
                aria-[selected=false]:underline-offset-[calc(3/16*1rem)]
                aria-[selected=false]:hover:cursor-pointer
                aria-[selected=false]:hover:decoration-[calc(3/16*1rem)]
              `}
              onClick={() => onStepSelect(index)}
            >
              <span className="sr-only">{unit}</span>
              {index + 1}
            </button>
          </li>
        );
      })}
    </ul>
  );
};

type CarouselPageNavProps = {
  currentIndex: number;
  total: number;
  unit: string;
  onPrev: () => void;
  onNext: () => void;
};

const CarouselPageNav = (props: CarouselPageNavProps) => {
  const { currentIndex, total, unit, onPrev, onNext } = props;
  return (
    <p className="relative m-0 flex items-center justify-end gap-3 p-0">
      <button
        type="button"
        onClick={onPrev}
        className={`
          relative flex size-6 items-center justify-center rounded-full border
          border-blue-1000 bg-white p-0 text-blue-1000
          after:absolute after:-inset-full after:m-auto after:size-11
          focus-visible:shadow-[0_0_0_calc(2/16*1rem)_#fce16b]
          focus-visible:outline-4 focus-visible:outline-offset-[calc(2/16*1rem)]
          focus-visible:outline-black focus-visible:outline-solid
        `}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="m5.27 8 5.33-5.33-.93-.94L3.4 8l6.27 6.27.93-.94L5.27 8Z"
            fill="currentColor"
          ></path>
        </svg>
        <span className="sr-only">前の{unit}</span>
      </button>
      <span
        className={`
          [text-box-edge:cap_alphabetic]
          [text-box-trim:trim-both]
        `}
      >
        {currentIndex + 1} / {total}
      </span>
      <button
        type="button"
        onClick={onNext}
        className={`
          relative flex size-6 items-center justify-center rounded-full border
          border-blue-1000 bg-white p-0 text-blue-1000
          after:absolute after:-inset-full after:m-auto after:size-11
          focus-visible:ring-[calc(2/16*1rem)] focus-visible:ring-yellow-300
          focus-visible:outline-4 focus-visible:outline-offset-[calc(2/16*1rem)]
          focus-visible:outline-black focus-visible:outline-solid
        `}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="m6 1.73-.93.94L10.4 8l-5.33 5.33.93.94L12.27 8 6 1.73Z"
            fill="currentColor"
          ></path>
        </svg>
        <span className="sr-only">次の{unit}</span>
      </button>
    </p>
  );
};

type CarouselBackgroundLayerProps = {
  className?: string;
  image: CarouselImage;
  imageSources?: CarouselImageSource[];
};

const CarouselBackgroundLayer = (props: CarouselBackgroundLayerProps) => {
  const { className, image, imageSources } = props;
  return (
    <div
      aria-hidden={true}
      className={`
        pointer-events-none absolute -inset-1/2 transform-gpu blur-[25px]
        ${className ?? ''}
      `}
    >
      <picture>
        {imageSources?.map((source) => (
          <source
            key={source.media}
            srcSet={source.srcSet}
            media={source.media}
            width={source.width}
            height={source.height}
          />
        ))}
        <img
          className="size-full object-cover"
          src={image.src}
          alt=""
          width={image.width}
          height={image.height}
        />
      </picture>
      <div className="absolute inset-0 bg-white mix-blend-soft-light" />
    </div>
  );
};

type CarouselExpandListProps = {
  className?: string;
  slides: CarouselSlide[];
  otherSlides: CarouselSlide[];
  unit: string;
};

const CarouselExpandList = (props: CarouselExpandListProps) => {
  const { className, slides, otherSlides, unit } = props;
  return (
    <Disclosure
      className={`
        ${className ?? ''}
      `}
    >
      <DisclosureSummary
        className={`
          rounded-8 cursor-pointer border border-solid-gray-600 bg-white! px-3
          py-2
        `}
      >
        すべての{unit}
      </DisclosureSummary>
      <div className="mt-3 pl-0">
        <ul className="grid list-none gap-y-6 p-0">
          {otherSlides.map((slide) => {
            const slideIndex = slides.findIndex((item) => item.id === slide.id);

            return (
              <li
                className={`
                  relative grid grid-cols-[auto] grid-rows-[auto]
                  [grid-template-areas:'main']
                  before:hidden before:h-full before:justify-self-center
                  before:border-r before:border-black before:[grid-area:number]
                  @[64rem]:-mx-12
                  @[64rem]:grid-cols-[calc(48/16*1rem)_3fr_1fr_calc(48/16*1rem)]
                  @[64rem]:grid-rows-[auto]
                  @[64rem]:[grid-template-areas:'number_main_next_.']
                  @[64rem]:group-has-[[open]]/carousel:before:block
                `}
                key={slide.id}
              >
                <p
                  className={`
                    text-oln-16B-100 hidden size-8 items-center justify-center
                    justify-self-center rounded-full border
                    border-solid-gray-800 bg-white pb-0.5 text-solid-gray-800
                    [grid-area:number]
                    aria-current:bg-solid-gray-800 aria-current:text-white
                    aria-current:ring-[calc(2/16*1rem)] aria-current:ring-white
                    aria-current:outline-1 aria-current:outline-offset-2
                    aria-current:outline-solid-gray-800
                    aria-current:outline-solid
                    aria-selected:bg-solid-gray-800 aria-selected:text-white
                    aria-selected:ring-[calc(2/16*1rem)]
                    aria-selected:ring-white aria-selected:outline-1
                    aria-selected:outline-offset-2
                    aria-selected:outline-solid-gray-800
                    aria-selected:outline-solid
                    @[64rem]:group-has-[[open]]/carousel:flex
                  `}
                  aria-hidden="true"
                >
                  {slideIndex + 1}
                </p>
                <div
                  className={`
                    relative min-w-0
                    [grid-area:main]
                  `}
                >
                  <a
                    className={`
                      focus-visible:rounded-4
                      focus-visible:ring-[calc(2/16*1rem)]
                      focus-visible:ring-yellow-300 focus-visible:outline-4
                      focus-visible:outline-offset-[calc(2/16*1rem)]
                      focus-visible:outline-black focus-visible:outline-solid
                      relative block
                      hover:outline-4 hover:-outline-offset-1
                      hover:outline-blue-900 hover:outline-solid
                      hover:after:pointer-events-none hover:after:absolute
                      hover:after:inset-px hover:after:ring-[calc(2/16*1rem)]
                      hover:after:ring-white hover:after:ring-inset
                    `}
                    href={slide.href}
                    target={slide.target}
                  >
                    <span className="sr-only">{slide.label}</span>
                    <div
                      className={`
                        grid h-full place-content-center rounded-[inherit]
                        outline-2 -outline-offset-2 outline-black outline-solid
                      `}
                    >
                      <picture>
                        {slide.imageSources?.map((source) => (
                          <source
                            key={source.media}
                            srcSet={source.srcSet}
                            media={source.media}
                            width={source.width}
                            height={source.height}
                          />
                        ))}
                        <img
                          className="block size-auto max-w-full"
                          src={slide.image.src}
                          alt={slide.image.alt}
                          width={slide.image.width}
                          height={slide.image.height}
                        />
                      </picture>
                    </div>
                  </a>
                </div>
                <div
                  className={`
                    relative -z-10 overflow-clip
                    [grid-area:main]
                  `}
                >
                  <CarouselBackgroundLayer
                    image={slide.image}
                    imageSources={slide.imageSources}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </Disclosure>
  );
};

type CarouselPanelAreaProps = {
  currentSlide: CarouselSlide;
  nextSlide: CarouselSlide;
  currentIndex: number;
  unit: string;
  isNormal: boolean;
  onNext: () => void;
};

const CarouselPanelArea = (props: CarouselPanelAreaProps) => {
  const { currentSlide, nextSlide, currentIndex, unit, isNormal, onNext } =
    props;

  const mainLabel = currentSlide.label || `${unit}${currentIndex + 1}`;
  const mainPanelAttributes = isNormal
    ? { role: 'tabpanel', 'aria-label': mainLabel }
    : {};

  return (
    <div
      className={`
        relative grid grid-cols-[auto] grid-rows-[auto]
        [grid-template-areas:'main']
        before:hidden before:h-full before:justify-self-center before:border-r
        before:border-black before:[grid-area:number]
        @[64rem]:-mx-12
        @[64rem]:grid-cols-[calc(48/16*1rem)_3fr_1fr_calc(48/16*1rem)]
        @[64rem]:grid-rows-[auto]
        @[64rem]:[grid-template-areas:'number_main_next_.']
        @[64rem]:group-has-[[open]]/carousel:before:block
      `}
    >
      <p
        className={`
          text-oln-16B-100 hidden size-8 items-center justify-center
          justify-self-center rounded-full border border-solid-gray-800 bg-white
          pb-0.5 text-solid-gray-800
          [grid-area:number]
          aria-current:bg-solid-gray-800 aria-current:text-white
          aria-current:ring-[calc(2/16*1rem)] aria-current:ring-white
          aria-current:outline-1 aria-current:outline-offset-2
          aria-current:outline-solid-gray-800 aria-current:outline-solid
          aria-selected:bg-solid-gray-800 aria-selected:text-white
          aria-selected:ring-[calc(2/16*1rem)] aria-selected:ring-white
          aria-selected:outline-1 aria-selected:outline-offset-2
          aria-selected:outline-solid-gray-800 aria-selected:outline-solid
          @[64rem]:group-has-[[open]]/carousel:flex
        `}
        aria-current={true}
        aria-hidden={true}
      >
        {currentIndex + 1}
      </p>

      <div
        className={`
          relative min-w-0
          [grid-area:main]
        `}
        aria-live="polite"
        aria-atomic={true}
      >
        <div key={currentSlide.id} {...mainPanelAttributes}>
          <a
            className={`
              focus-visible:rounded-8 focus-visible:overflow-hidden
              focus-visible:ring-[calc(2/16*1rem)] focus-visible:ring-yellow-300
              focus-visible:outline-4
              focus-visible:-outline-offset-[calc(2/16*1rem)]
              focus-visible:outline-black focus-visible:outline-solid
              focus-visible:after:rounded-6 focus-visible:after:inset-0.5
              focus-visible:after:ring-[calc(2/16*1rem)]
              focus-visible:after:ring-yellow-300 focus-visible:after:ring-inset
              relative block
              after:pointer-events-none after:absolute
              hover:outline-4 hover:-outline-offset-2 hover:outline-blue-900
              hover:outline-solid hover:after:inset-0.5
              hover:after:ring-[calc(2/16*1rem)] hover:after:ring-white
              hover:after:ring-inset
            `}
            href={currentSlide.href}
            target={currentSlide.target}
          >
            <span className="sr-only">{mainLabel}</span>
            <div
              className={`
                grid h-full place-content-center rounded-[inherit] outline-2
                -outline-offset-2 outline-black outline-solid
              `}
            >
              <picture>
                {currentSlide.imageSources?.map((source) => (
                  <source
                    key={source.media}
                    srcSet={source.srcSet}
                    media={source.media}
                    width={source?.width}
                    height={source?.height}
                  />
                ))}
                <img
                  className="block size-auto max-w-full"
                  src={currentSlide.image.src}
                  alt={currentSlide.image.alt}
                  width={currentSlide.image.width}
                  height={currentSlide.image.height}
                />
              </picture>
            </div>
          </a>
        </div>
      </div>

      <p
        className={`
          hidden min-w-0 border border-l-0 border-solid-gray-420 p-6
          [grid-area:next]
          group-has-[[open]]/carousel:hidden!
          @[64rem]:block
        `}
      >
        <button
          type="button"
          onClick={onNext}
          className={`
            relative cursor-pointer touch-manipulation border
            border-solid-gray-420 bg-white p-0 text-left underline
            decoration-[calc(1/16*1rem)] underline-offset-[calc(3/16*1rem)]
            hover:decoration-[calc(3/16*1rem)] hover:outline-4
            hover:-outline-offset-1 hover:outline-blue-900 hover:outline-solid
            hover:after:pointer-events-none hover:after:absolute
            hover:after:inset-0 hover:after:ring-[calc(2/16*1rem)]
            hover:after:ring-white hover:after:ring-inset
            focus-visible:rounded-[calc(4/16*1rem)]
            focus-visible:ring-[calc(2/16*1rem)] focus-visible:ring-yellow-300
            focus-visible:outline-4
            focus-visible:outline-offset-[calc(2/16*1rem)]
            focus-visible:outline-black focus-visible:outline-solid
          `}
        >
          <picture>
            {nextSlide.imageSources?.map((source) => (
              <source
                key={source.media}
                srcSet={source.srcSet}
                media={source.media}
                width={source?.width}
                height={source?.height}
              />
            ))}
            <img
              className="block size-auto max-w-full"
              src={nextSlide.image.src}
              alt={nextSlide.image.alt}
              width={nextSlide.image.width}
              height={nextSlide.image.height}
            />
          </picture>

          <span
            className={`
              text-std-16B-170 block border-t border-solid-gray-420 p-4
              decoration-inherit
            `}
          >
            次の{unit}
          </span>
        </button>
      </p>

      <div
        className={`
          relative -z-10 overflow-clip
          [grid-area:main]
        `}
      >
        <CarouselBackgroundLayer
          image={currentSlide.image}
          imageSources={currentSlide.imageSources}
        />
      </div>

      <div
        className={`
          relative -z-10 hidden overflow-clip
          [grid-area:next]
          group-has-[[open]]/carousel:hidden!
          @[64rem]:block
        `}
      >
        <CarouselBackgroundLayer
          image={nextSlide.image}
          imageSources={nextSlide.imageSources}
        />
      </div>
    </div>
  );
};

// Carousel Main Component
// ==============================

export type CarouselProps = ComponentProps<'section'> & {
  slides: CarouselSlide[];
  currentIndex: number;
  unit?: string;
  isNormal: boolean;
  innerRef: Ref<HTMLDivElement>;
  onPrev: () => void;
  onNext: () => void;
  onStepSelect: (index: number) => void;
};

const Carousel = (props: CarouselProps) => {
  const {
    className,
    slides,
    currentIndex,
    unit = 'スライド',
    isNormal,
    innerRef,
    onPrev,
    onNext,
    onStepSelect,
    ...rest
  } = props;

  if (slides.length === 0) {
    return null;
  }

  const total = slides.length;
  const normalizedIndex = ((currentIndex % total) + total) % total;
  const currentSlide = slides[normalizedIndex];
  const nextSlide = slides[(normalizedIndex + 1) % total];
  const otherSlides =
    total > 1
      ? [
          ...slides.slice(normalizedIndex + 1),
          ...slides.slice(0, normalizedIndex),
        ]
      : [];

  return (
    <section
      className={`
        group/carousel @container block
        ${className ?? ''}
      `}
      {...rest}
    >
      <div
        className={`
          text-std-16N-170 relative z-0 max-w-[calc(1440/16*1rem)]
          text-solid-gray-800
          @[64rem]:px-12
        `}
        ref={innerRef}
      >
        <CarouselPanelArea
          currentSlide={currentSlide}
          nextSlide={nextSlide}
          currentIndex={normalizedIndex}
          unit={unit}
          isNormal={isNormal}
          onNext={onNext}
        />

        <div
          className={`
            flex items-center gap-5 py-3
            group-has-[[open]]/carousel:pb-14
            @[64rem]:gap-8
          `}
        >
          <div
            className={`
              shrink-0
              group-has-[[open]]/carousel:hidden!
              @[64rem]:hidden
            `}
          >
            <CarouselPageNav
              currentIndex={normalizedIndex}
              total={total}
              unit={unit}
              onPrev={onPrev}
              onNext={onNext}
            />
          </div>

          <div
            className={`
              hidden
              group-has-[[open]]/carousel:hidden!
              @[64rem]:flex
            `}
          >
            <CarouselStepNav
              slides={slides}
              selectedIndex={normalizedIndex}
              unit={unit}
              onStepSelect={onStepSelect}
            />
          </div>

          <CarouselExpandList
            className={`
              -order-1
              open:flex-1
            `}
            slides={slides}
            otherSlides={otherSlides}
            unit={unit}
          />
        </div>
      </div>
    </section>
  );
};

export default Carousel;
