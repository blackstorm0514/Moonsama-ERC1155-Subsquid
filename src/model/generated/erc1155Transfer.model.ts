import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"
import {ERC1155Token} from "./erc1155Token.model"
import {ERC1155Owner} from "./erc1155Owner.model"

@Entity_()
export class ERC1155Transfer {
  constructor(props?: Partial<ERC1155Transfer>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Index_()
  @ManyToOne_(() => ERC1155Token, {nullable: false})
  token!: ERC1155Token

  @Index_()
  @ManyToOne_(() => ERC1155Owner, {nullable: true})
  from!: ERC1155Owner | undefined | null

  @Index_()
  @ManyToOne_(() => ERC1155Owner, {nullable: true})
  to!: ERC1155Owner | undefined | null

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  timestamp!: bigint

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  block!: bigint

  @Column_("text", {nullable: false})
  transactionHash!: string
}
