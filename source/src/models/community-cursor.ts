import { CommunityPermissionKind } from '../config/permissions';
import { CommunitySortOptions, PaginationValues, PopulateStrategy } from '../config/types';
import { integerParser, stringParser, toObjectId } from '../lib/parsers';
import { ModelBase, ObjectId, prop } from './base';
import { Profile } from './profile';

/**
 * Community cursor model for constructing conditions for listing communities.
 */
export class CommunityCursor extends ModelBase {
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
   * Defines the `communityAbilities` field.
   */
  @prop({
    parser: { resolver: integerParser(), array: true },
    populatable: [PopulateStrategy.PROFILE],
    emptyValue: [],
  })
  public filterPermissionKinds: CommunityPermissionKind[];

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
  public buildQuery(profile: Profile) {

    const profileCommunityIds = profile.communityAbilities.filter((a) => CommunityPermissionKind.READ === a.kind)
      .map((a) => toObjectId(a.communityId));

    const conditions: any[] = [
      { _id: { $in: profileCommunityIds } },
    ];

    if (this.filterPermissionKinds) {
      this.filterPermissionKinds.forEach((permission) => {
        const kindIds = profile.communityAbilities.filter((a) => {
          return permission === a.kind;
        })
        .map((a) => toObjectId(a.communityId));
        conditions.push({ _id: { $in: kindIds } });
      });
    }

    if (this.filterIds) {
      conditions.push({ _id: { $in: this.filterIds } });
    }

    if (this.searchNgrams) {
      conditions.push({ $text: { $search: this.searchNgrams } });
    }

    return { $and: conditions };
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

    if (this.sort === CommunitySortOptions.NAME_ASC) {
      data['name'] = 1;
    }

    if (this.sort === CommunitySortOptions.NAME_DESC) {
      data['name'] = -1;
    }

    if (Object.keys(data).length === 0) {
      data['_id'] = -1;
    }

    return data;
  }

}
