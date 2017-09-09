import React from 'react';
import NotificationsContainer from './containers/notifications_container';
import PropTypes from 'prop-types';
import LoadingBarContainer from './containers/loading_bar_container';
import TabsBar from './components/tabs_bar';
import ModalContainer from './containers/modal_container';
import { connect } from 'react-redux';
import { Redirect, withRouter } from 'react-router-dom';
import { isMobile } from '../../is_mobile';
import { debounce } from 'lodash';
import { uploadCompose } from '../../actions/compose';
import { refreshHomeTimeline } from '../../actions/timelines';
import { refreshNotifications } from '../../actions/notifications';
import { clearStatusesHeight } from '../../actions/statuses';
import { WrappedSwitch, WrappedRoute } from './util/react_router_helpers';
import UploadArea from './components/upload_area';
import ColumnsAreaContainer from './containers/columns_area_container';
import {
  Compose,
  Status,
  GettingStarted,
  PublicTimeline,
  CommunityTimeline,
  AccountTimeline,
  AccountGallery,
  HomeTimeline,
  Followers,
  Following,
  Reblogs,
  Favourites,
  HashtagTimeline,
  Notifications,
  FollowRequests,
  GenericNotFound,
  FavouritedStatuses,
  Blocks,
  Mutes,
} from './util/async-components';

// Dummy import, to make sure that <Status /> ends up in the application bundle.
// Without this it ends up in ~8 very commonly used bundles.
import '../../../glitch/components/status';

const mapStateToProps = state => ({
  systemFontUi: state.getIn(['meta', 'system_font_ui']),
  layout: state.getIn(['local_settings', 'layout']),
  isWide: state.getIn(['local_settings', 'stretch']),
  navbarUnder: state.getIn(['local_settings', 'navbar_under']),
  isComposing: state.getIn(['compose', 'is_composing']),
});

@connect(mapStateToProps)
@withRouter
export default class UI extends React.PureComponent {

  static contextTypes = {
    router: PropTypes.object.isRequired,
  }

  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    children: PropTypes.node,
    layout: PropTypes.string,
    isWide: PropTypes.bool,
    systemFontUi: PropTypes.bool,
    navbarUnder: PropTypes.bool,
    isComposing: PropTypes.bool,
    location: PropTypes.object,
  };

  state = {
    width: window.innerWidth,
    draggingOver: false,
  };

  handleResize = debounce(() => {
    // The cached heights are no longer accurate, invalidate
    this.props.dispatch(clearStatusesHeight());

    this.setState({ width: window.innerWidth });
  }, 500, {
    trailing: true,
  });

  handleDragEnter = (e) => {
    e.preventDefault();

    if (!this.dragTargets) {
      this.dragTargets = [];
    }

    if (this.dragTargets.indexOf(e.target) === -1) {
      this.dragTargets.push(e.target);
    }

    if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
      this.setState({ draggingOver: true });
    }
  }

  handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      e.dataTransfer.dropEffect = 'copy';
    } catch (err) {

    }

    return false;
  }

  handleDrop = (e) => {
    e.preventDefault();

    this.setState({ draggingOver: false });

    if (e.dataTransfer && e.dataTransfer.files.length === 1) {
      this.props.dispatch(uploadCompose(e.dataTransfer.files));
    }
  }

  handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();

    this.dragTargets = this.dragTargets.filter(el => el !== e.target && this.node.contains(el));

    if (this.dragTargets.length > 0) {
      return;
    }

    this.setState({ draggingOver: false });
  }

  closeUploadModal = () => {
    this.setState({ draggingOver: false });
  }

  handleServiceWorkerPostMessage = ({ data }) => {
    if (data.type === 'navigate') {
      this.context.router.history.push(data.path);
    } else {
      console.warn('Unknown message type:', data.type);
    }
  }

  componentWillMount () {
    window.addEventListener('resize', this.handleResize, { passive: true });
    document.addEventListener('dragenter', this.handleDragEnter, false);
    document.addEventListener('dragover', this.handleDragOver, false);
    document.addEventListener('drop', this.handleDrop, false);
    document.addEventListener('dragleave', this.handleDragLeave, false);
    document.addEventListener('dragend', this.handleDragEnd, false);

    if ('serviceWorker' in  navigator) {
      navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerPostMessage);
    }

    this.props.dispatch(refreshHomeTimeline());
    this.props.dispatch(refreshNotifications());
  }

  shouldComponentUpdate (nextProps) {
    if (nextProps.isComposing !== this.props.isComposing) {
      // Avoid expensive update just to toggle a class
      this.node.classList.toggle('is-composing', nextProps.isComposing);
      this.node.classList.toggle('navbar-under', nextProps.navbarUnder);

      return false;
    }

    // Why isn't this working?!?
    // return super.shouldComponentUpdate(nextProps, nextState);
    return true;
  }

  componentDidUpdate (prevProps) {
    if (![this.props.location.pathname, '/'].includes(prevProps.location.pathname)) {
      this.columnsAreaNode.handleChildrenContentChange();
    }
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('dragenter', this.handleDragEnter);
    document.removeEventListener('dragover', this.handleDragOver);
    document.removeEventListener('drop', this.handleDrop);
    document.removeEventListener('dragleave', this.handleDragLeave);
    document.removeEventListener('dragend', this.handleDragEnd);
  }

  setRef = (c) => {
    this.node = c;
  }

  setColumnsAreaRef = (c) => {
    this.columnsAreaNode = c.getWrappedInstance().getWrappedInstance();
  }

  render () {
    const { width, draggingOver } = this.state;
    const { children, layout, isWide, navbarUnder } = this.props;

    const columnsClass = layout => {
      switch (layout) {
      case 'single':
        return 'single-column';
      case 'multiple':
        return 'multi-columns';
      default:
        return 'auto-columns';
      }
    };

    const className = classNames('ui', columnsClass(layout), {
      'wide': isWide,
      'system-font': this.props.systemFontUi,
      'navbar-under': navbarUnder,
    });

    return (
      <div className={className} ref={this.setRef}>
        {navbarUnder ? null : (<TabsBar />)}
        <ColumnsAreaContainer ref={this.setColumnsAreaRef} singleColumn={isMobile(width, layout)}>
          <WrappedSwitch>
            <Redirect from='/' to='/getting-started' exact />
            <WrappedRoute path='/getting-started' component={GettingStarted} content={children} />
            <WrappedRoute path='/timelines/home' component={HomeTimeline} content={children} />
            <WrappedRoute path='/timelines/public' exact component={PublicTimeline} content={children} />
            <WrappedRoute path='/timelines/public/local' component={CommunityTimeline} content={children} />
            <WrappedRoute path='/timelines/tag/:id' component={HashtagTimeline} content={children} />

            <WrappedRoute path='/notifications' component={Notifications} content={children} />
            <WrappedRoute path='/favourites' component={FavouritedStatuses} content={children} />

            <WrappedRoute path='/statuses/new' component={Compose} content={children} />
            <WrappedRoute path='/statuses/:statusId' exact component={Status} content={children} />
            <WrappedRoute path='/statuses/:statusId/reblogs' component={Reblogs} content={children} />
            <WrappedRoute path='/statuses/:statusId/favourites' component={Favourites} content={children} />

            <WrappedRoute path='/accounts/:accountId' exact component={AccountTimeline} content={children} />
            <WrappedRoute path='/accounts/:accountId/followers' component={Followers} content={children} />
            <WrappedRoute path='/accounts/:accountId/following' component={Following} content={children} />
            <WrappedRoute path='/accounts/:accountId/media' component={AccountGallery} content={children} />

            <WrappedRoute path='/follow_requests' component={FollowRequests} content={children} />
            <WrappedRoute path='/blocks' component={Blocks} content={children} />
            <WrappedRoute path='/mutes' component={Mutes} content={children} />

            <WrappedRoute component={GenericNotFound} content={children} />
          </WrappedSwitch>
        </ColumnsAreaContainer>
        <NotificationsContainer />
        {navbarUnder ? (<TabsBar />) : null}
        <LoadingBarContainer className='loading-bar' />
        <ModalContainer />
        <UploadArea active={draggingOver} onClose={this.closeUploadModal} />
      </div>
    );
  }

}
