//  Package imports.
import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { injectIntl, defineMessages } from 'react-intl';
import classNames from 'classnames';

//  Actions.
import { openModal } from 'flavours/glitch/actions/modal';
import { cycleElefriendCompose } from 'flavours/glitch/actions/compose';

//  Components.
import Composer from 'flavours/glitch/features/composer';
import DrawerAccount from './account';
import DrawerHeader from './header';
import DrawerResults from './results';
import SearchContainer from './containers/search_container';

//  Utils.
import { me, mascot } from 'flavours/glitch/util/initial_state';
import { wrap } from 'flavours/glitch/util/redux_helpers';

//  Messages.
const messages = defineMessages({
  compose: { id: 'navigation_bar.compose', defaultMessage: 'Compose new toot' },
});

//  State mapping.
const mapStateToProps = state => ({
  account: state.getIn(['accounts', me]),
  columns: state.getIn(['settings', 'columns']),
  elefriend: state.getIn(['compose', 'elefriend']),
  results: state.getIn(['search', 'results']),
  searchHidden: state.getIn(['search', 'hidden']),
  submitted: state.getIn(['search', 'submitted']),
  unreadNotifications: state.getIn(['notifications', 'unread']),
  showNotificationsBadge: state.getIn(['local_settings', 'notifications', 'tab_badge']),
});

//  Dispatch mapping.
const mapDispatchToProps = (dispatch, { intl }) => ({
  onClickElefriend () {
    dispatch(cycleElefriendCompose());
  },
  onOpenSettings (e) {
    e.preventDefault();
    e.stopPropagation();
    dispatch(openModal('SETTINGS', {}));
  },
});

//  The component.
export default @connect(mapStateToProps, mapDispatchToProps)
@injectIntl
class Compose extends React.PureComponent {
  static propTypes = {
    intl: PropTypes.object.isRequired,
    isSearchPage: PropTypes.bool,
    multiColumn: PropTypes.bool,

    //  State props.
    account: ImmutablePropTypes.map,
    columns: ImmutablePropTypes.list,
    results: ImmutablePropTypes.map,
    elefriend: PropTypes.number,
    searchHidden: PropTypes.bool,
    submitted: PropTypes.bool,
    unreadNotifications: PropTypes.number,
    showNotificationsBadge: PropTypes.bool,

    //  Dispatch props.
    onClickElefriend: PropTypes.func,
    onOpenSettings: PropTypes.func,
  };

  //  Rendering.
  render () {
    const {
      account,
      columns,
      elefriend,
      intl,
      multiColumn,
      onClickElefriend,
      onOpenSettings,
      results,
      searchHidden,
      submitted,
      isSearchPage,
      unreadNotifications,
      showNotificationsBadge,
    } = this.props;
    const computedClass = classNames('drawer', `mbstobon-${elefriend}`);

    //  The result.
    return (
      <div className={computedClass} role='region' aria-label={intl.formatMessage(messages.compose)}>
        {multiColumn && (
          <DrawerHeader
            columns={columns}
            unreadNotifications={unreadNotifications}
            showNotificationsBadge={showNotificationsBadge}
            intl={intl}
            onSettingsClick={onOpenSettings}
          />
        )}
        {(multiColumn || isSearchPage) && <SearchContainer /> }
        <div className='drawer__pager'>
          {!isSearchPage && <div className='drawer__inner'>
            <DrawerAccount account={account} />
            <Composer />
            {multiColumn && (
              <div className='drawer__inner__mastodon'>
                {mascot ? <img alt='' draggable='false' src={mascot} /> : <button className='mastodon' onClick={onClickElefriend} />}
              </div>
            )}
          </div>}

          {(multiColumn || isSearchPage) &&
            <DrawerResults
              results={results}
              visible={submitted && !searchHidden}
            />}
        </div>
      </div>
    );
  }
}
