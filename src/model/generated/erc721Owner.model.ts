import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, OneToMany as OneToMany_} from "typeorm"
import * as marshal from "./marshal"
import {ERC721Token} from "./erc721Token.model"

@Entity_()
export class ERC721Owner {
  constructor(props?: Partial<ERC721Owner>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @OneToMany_(() => ERC721Token, e => e.owner)
  ownedTokens!: ERC721Token[]

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: true})
  balance!: bigint | undefined | null
}
