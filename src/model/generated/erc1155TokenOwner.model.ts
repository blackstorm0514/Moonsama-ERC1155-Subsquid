import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"
import {ERC1155Owner} from "./erc1155Owner.model"
import {ERC1155Token} from "./erc1155Token.model"

@Entity_()
export class ERC1155TokenOwner {
  constructor(props?: Partial<ERC1155TokenOwner>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Index_()
  @ManyToOne_(() => ERC1155Owner, {nullable: false})
  owner!: ERC1155Owner

  @Index_()
  @ManyToOne_(() => ERC1155Token, {nullable: false})
  token!: ERC1155Token

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  balance!: bigint
}
