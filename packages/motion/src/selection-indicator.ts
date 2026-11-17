/**
 * Move the selected plate between native controls without coupling the
 * animation to Vue or React render cycles. Components retain a static
 * selected paint until the first usable measurement.
 */
export function attachSelectionIndicator(
  track: HTMLElement,
  indicator: HTMLElement,
  selectedSelector: string,
): () => void {
  const view = track.ownerDocument.defaultView;
  if (!view) return () => undefined;

  let measureFrame = 0;
  let readyFrame = 0;
  let ready = false;
  const measure = () => {
    measureFrame = 0;
    const selected = track.querySelector<HTMLElement>(selectedSelector);
    if (!selected || selected.offsetWidth === 0) {
      view.cancelAnimationFrame(readyFrame);
      ready = false;
      indicator.dataset.ready = 'false';
      return;
    }
    const offset = `${selected.offsetLeft}px`;
    const width = `${selected.offsetWidth}px`;
    if (indicator.style.getPropertyValue('--neoverse-selection-offset') !== offset) {
      indicator.style.setProperty('--neoverse-selection-offset', offset);
    }
    if (indicator.style.getPropertyValue('--neoverse-selection-width') !== width) {
      indicator.style.setProperty('--neoverse-selection-width', width);
    }
    if (!ready) {
      readyFrame = view.requestAnimationFrame(() => {
        ready = true;
        indicator.dataset.ready = 'true';
      });
    }
  };
  const schedule = () => {
    if (measureFrame) return;
    measureFrame = view.requestAnimationFrame(measure);
  };
  const resize = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : undefined;
  const observeSizes = () => {
    if (!resize) return;
    resize.disconnect();
    resize.observe(track);
    for (const button of track.querySelectorAll('button')) resize.observe(button);
  };
  const changes = new MutationObserver((records) => {
    if (records.some((record) => record.type === 'childList')) observeSizes();
    schedule();
  });
  changes.observe(track, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['aria-selected', 'aria-current', 'class', 'disabled'],
  });
  observeSizes();
  measure();
  return () => {
    changes.disconnect();
    resize?.disconnect();
    view.cancelAnimationFrame(measureFrame);
    view.cancelAnimationFrame(readyFrame);
  };
}
