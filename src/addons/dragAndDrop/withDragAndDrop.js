import PropTypes from 'prop-types'
import React from 'react'
import { DragDropContext } from 'react-dnd'
import { HTML5Backend } from "react-dnd-html5-backend-14";
import { DndProvider, useDragDropManager } from "react-dnd-14";
import cn from 'classnames'
import { accessor } from '../../utils/propTypes'
import DraggableEventWrapper from './DraggableEventWrapper'
import { DroppableDayWrapper, DroppableDateCellWrapper } from './DropWrappers'

const shouldUseDragDropContext14 = window.Pulse.features.calendar_dnd_14;
let html5Backend

try {
  html5Backend = shouldUseDragDropContext14 ? HTML5Backend : require('react-dnd-html5-backend');
} catch (err) {
  /* optional dep missing */
}

/**
 * Creates a higher-order component (HOC) supporting drag & drop and optionally resizing
 * of events:
 *
 * ```js
 *    import Calendar from 'react-big-calendar'
 *    import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
 *    export default withDragAndDrop(Calendar)
 * ```
 * (you can optionally pass any dnd backend as an optional second argument to `withDragAndDrop`.
 * It defaults to `react-dnd-html5-backend` which you should probably include in
 * your project if using this default).
 *
 * Set `resizable` to true in your calendar if you want events to be resizable.
 *
 * The HOC adds `onEventDrop` and `onEventResize` callback properties if the events are
 * moved or resized. They are called with these signatures:
 *
 * ```js
 *    function onEventDrop({ event, start, end, allDay }) {...}
 *    function onEventResize(type, { event, start, end, allDay }) {...}  // type is always 'drop'
 * ```
 *
 * Moving and resizing of events has some subtlety which one should be aware of.
 *
 * In some situations, non-allDay events are displayed in "row" format where they
 * are rendered horizontally. This is the case for ALL events in a month view. It
 * is also occurs with multi-day events in a day or week view (unless `showMultiDayTimes`
 * is set).
 *
 * When dropping or resizing non-allDay events into a the header area or when
 * resizing them horizontally because they are displayed in row format, their
 * times are preserved, only their date is changed.
 *
 * If you care about these corner cases, you can examine the `allDay` param suppled
 * in the callback to determine how the user dropped or resized the event.
 *
 * @param {*} Calendar
 * @param {*} backend
 */
export default function withDragAndDrop(
  Calendar,
  { backend = html5Backend } = {}
) {
  class DragAndDropCalendar extends React.Component {
    static propTypes = {
      onEventDrop: PropTypes.func,
      onEventResize: PropTypes.func,
      startAccessor: accessor,
      endAccessor: accessor,
      allDayAccessor: accessor,
      draggableAccessor: accessor,
      resizableAccessor: accessor,
      selectable: PropTypes.oneOf([true, false, 'ignoreEvents']),
      resizable: PropTypes.bool,
      components: PropTypes.object,
      step: PropTypes.number,
      dragDropManager: shouldUseDragDropContext14 ? PropTypes.object : undefined,
    }

    static defaultProps = {
      // TODO: pick these up from Calendar.defaultProps
      components: {},
      startAccessor: 'start',
      endAccessor: 'end',
      allDayAccessor: 'allDay',
      draggableAccessor: null,
      resizableAccessor: null,
      step: 30,
    }

    static contextTypes = {
      dragDropManager: PropTypes.object,
    }

    static childContextTypes = {
      onEventDrop: PropTypes.func,
      onEventResize: PropTypes.func,
      components: PropTypes.object,
      startAccessor: accessor,
      endAccessor: accessor,
      draggableAccessor: accessor,
      resizableAccessor: accessor,
      step: PropTypes.number,
    }

    getChildContext() {
      return {
        onEventDrop: this.props.onEventDrop,
        onEventResize: this.props.onEventResize,
        components: this.props.components,
        startAccessor: this.props.startAccessor,
        endAccessor: this.props.endAccessor,
        step: this.props.step,
        draggableAccessor: this.props.draggableAccessor,
        resizableAccessor: this.props.resizableAccessor,
      }
    }

    constructor(...args) {
      super(...args)
      this.state = { isDragging: false }
    }

    componentWillMount() {
      if (!shouldUseDragDropContext14) {
        let monitor = this.context.dragDropManager.getMonitor()
        this.monitor = monitor
      }
      else 
      {
        this.monitor = this.props.dragDropManager.getMonitor()
      }
      this.unsubscribeToStateChange = this.monitor.subscribeToStateChange(
        this.handleStateChange
      )
    }

    componentWillUnmount() {
      this.monitor = null
      this.unsubscribeToStateChange()
    }

    handleStateChange = () => {
      const isDragging = !!this.monitor.getItem()

      if (isDragging !== this.state.isDragging) {
        setTimeout(() => this.setState({ isDragging }))
      }
    }

    render() {
      const { selectable, components, ...props } = this.props

      delete props.onEventDrop
      delete props.onEventResize

      props.selectable = selectable ? 'ignoreEvents' : false

      props.className = cn(
        props.className,
        'rbc-addons-dnd',
        this.state.isDragging && 'rbc-addons-dnd-is-dragging'
      )

      props.components = {
        ...components,
        dateCellWrapper: DroppableDateCellWrapper,
        dayWrapper: DroppableDayWrapper,
        eventWrapper: DraggableEventWrapper,
      }

      return <Calendar {...props} />
    }
  }

  if (backend === false) {
    return DragAndDropCalendar
  } else {
    if (!shouldUseDragDropContext14) {
      return DragDropContext(backend)(DragAndDropCalendar)
    }

    return withDragDrop(DragAndDropCalendar, backend);
  }
}

function withDragDrop(WrappedComponent, backend) {
  const WrappedComponentWithDragDropManager = props => {
    const dragDropManager = useDragDropManager();
    return <WrappedComponent {...props} dragDropManager={dragDropManager} />;
  };

  return props =>
    (<DndProvider backend={backend}>
      <WrappedComponentWithDragDropManager {...props} />
    </DndProvider>);
}
