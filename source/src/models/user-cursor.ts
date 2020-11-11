import { CommunityPermissionKind } from '../config/permissions';
import { PaginationValues, PopulateStrategy, UserSortOptions } from '../config/types';
import { integerParser, stringParser, toObjectId } from '../lib/parsers';
import { ModelBase, ObjectId, prop } from './base';

/**
 * User cursor model for constructing conditions for listing communities.
 */
export class UserCursor extends ModelBase {
  /**
   * Defines the `skip` field.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateStrategy.PROFILE],
    setter(v) {
      return v < 0 ? 0 : v;
    },
    defaultValue: 0,
  })
  public skip: number;

  /**
   * Defines the `limit` field.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateStrategy.PROFILE],
    setter(v) {
      if (v < 1) { v = PaginationValues.PAGE_DEFAULT_LIMIT; }
      if (v > PaginationValues.PAGE_MAX_LIMIT) { v = PaginationValues.PAGE_MAX_LIMIT; }
      return v;
    },
    defaultValue: PaginationValues.PAGE_DEFAULT_LIMIT,
  })
  public limit: number;

  /**
   * Defines the `searchNgrams` fields.
   */
  @prop({
    parser: { resolver: stringParser() },
  })
  public searchNgrams: string;

  /**
   * Defines the `search` field.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    setter(v) {
      this.searchNgrams = v;
      return v;
    },
  })
  public search: string;

  /**
   * Defines the `filterIds` field.
   */
  @prop({
    setter(v) {
      return v.map((id: string) => toObjectId(id));
    },
    populatable: [PopulateStrategy.PROFILE],
  })
  public filterIds: ObjectId[];

  /**
   * Defines the `filterCommunityIds` field.
   */
  @prop({
    parser: { resolver: stringParser(), array: true },
    populatable: [PopulateStrategy.PROFILE],
  })
  public filterCommunityIds: string[];

  /**
   * Defines the `sort` field.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateStrategy.PROFILE],
  })
  public sort: number;

  /**
   * Returns MongoDB condition for querying communities.
   */
  public buildQuery() {

    const query = {} as any;

    if (this.searchNgrams) {
      query['$text'] = { $search: this.searchNgrams };
    }
    if (this.filterIds) {
      query['_id'] = { $in: this.filterIds };
    }
    if (this.filterCommunityIds) {
      query['communityAbilities.communityId'] = { $in: this.filterCommunityIds };
      query['communityAbilities.kind'] = { $eq: CommunityPermissionKind.READ };
    }

    return query;
  }

  /**
   * Returns MongoDB condition which prevents listing deleted documents.
   */
  public buildPersistentFilter() {
    return {
      '_deletedAt': null,
    } as any;
  }

  /**
   * Returns MongoDB condition for sorting communities.
   */
  public buildSort() {
    const data = {};

    if (this.searchNgrams !== null) {
      data['score'] = { $meta: 'textScore' };
    }

    if (this.sort === UserSortOptions.LAST_NAME_ASC) {
      data['lastName'] = 1;
    }

    if (this.sort === UserSortOptions.LAST_NAME_DESC) {
      data['lastName'] = -1;
    }

    if (Object.keys(data).length === 0) {
      data['_id'] = -1;
    }

    return data;
  }

}
